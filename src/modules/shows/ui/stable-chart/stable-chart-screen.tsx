'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { ScreenTitle, ScreenLede, Card } from '@/shared/ui/organizer/card';
import { StatusPill } from '@/shared/ui/organizer/status-pill';
import { ghostButtonClass, primaryButtonClass } from '@/shared/ui/organizer/buttons';
import { IconPrinter } from '@/shared/ui/organizer/icons';
import { fa } from '@/shared/lib/organizer-theme';
import { splitStallsIntoRows, truncateHorseName } from '../../utils';
import { MAX_STABLES } from '../../constants';
import { SM_LABEL, SM_INPUT, SM_SELECT } from '../show-manager/tokens';
import {
  useSetStableCount,
  useToggleStableChartStatus,
  useAutoAssignStableStalls,
  useApplySavedLocationStables,
} from '../../hooks/use-stable-chart-mutations';
import { StableConfigRow } from './stable-config-row';
import { StallBox } from './stall-box';
import type { StableChartPageData } from '../../data/stable-chart-queries';

/**
 * "Stable Chart" — every barn and stall for one show: build the layout,
 * click a stall to rename it, assign horses (by hand or auto-assign), then
 * publish. Ported from showstaff.html's showStableChart and its supporting
 * functions (~13846-14147). Reached from, and returns to, the Horses screen —
 * see horses-screen.tsx's "🏠 Stable Chart" button.
 *
 * Every edit here is its own Server Action + `router.refresh()` (see
 * use-stable-chart-mutations.ts) rather than a client-held draft saved on
 * submit — legacy's own comment on this screen is explicit that a full
 * re-navigation on every keystroke-level edit read as "funky"/broken, and
 * that only the *first* open should scroll-to-top. `router.refresh()` is
 * this app's equivalent of legacy's in-place `list-view.innerHTML` patch: a
 * soft RSC re-fetch, not a URL navigation, so scroll position and the rest
 * of the page are left alone the same way.
 */
export function StableChartScreen({ data }: { data: StableChartPageData }) {
  const { showId, showName, chart, savedLocations } = data;

  const setCount = useSetStableCount();
  const togglePublish = useToggleStableChartStatus();
  const autoAssign = useAutoAssignStableStalls();
  const applySavedLocation = useApplySavedLocationStables();

  const stableCountRef = useRef<HTMLInputElement>(null);
  const savedLocationSelectRef = useRef<HTMLSelectElement>(null);

  const totalStalls = chart.stables.reduce((n, b) => n + b.stalls.length, 0);
  const occupied = chart.stables.reduce(
    (n, b) => n + b.stalls.filter((s) => !s.closed && !!s.horseId).length,
    0
  );
  const closedCount = chart.stables.reduce((n, b) => n + b.stalls.filter((s) => s.closed).length, 0);
  const published = chart.status === 'published';

  return (
    <div className="font-[family-name:var(--font-ar)] text-ink-deep">
      <div className="mb-4 flex flex-wrap items-center gap-2.5 print:hidden">
        <Link href={`/dashboard/horses?show=${showId}`} className={ghostButtonClass}>
          🐴 Back to Horses
        </Link>
        {totalStalls > 0 && (
          <button
            type="button"
            className={ghostButtonClass}
            onClick={() => {
              window.print();
            }}
          >
            <IconPrinter size={14} /> Print
          </button>
        )}
      </div>

      <div className="mb-5 print:hidden">
        <ScreenTitle className="mb-1.5">Stable Chart — {showName}</ScreenTitle>
        <ScreenLede className="mb-0">
          Set the stables and stalls below, click any stall to rename it, then approve to publish the
          chart.
        </ScreenLede>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3.5 print:hidden">
        {published ? (
          <StatusPill bg={fa.greenTint} border={fa.greenLine} fg={fa.green}>
            ✓ Published — visible to everyone
          </StatusPill>
        ) : (
          <StatusPill bg={fa.goldTint} border={fa.goldLine} fg={fa.goldFg}>
            Draft — not published yet
          </StatusPill>
        )}

        {totalStalls > 0 && (
          <span className="text-[13px] text-[#5A6B63]">
            {occupied} occupied · {totalStalls - occupied - closedCount} available
            {closedCount > 0 && ` · ${String(closedCount)} closed`} · {totalStalls} total stalls
          </span>
        )}

        <button
          type="button"
          disabled={togglePublish.isPending}
          className={primaryButtonClass}
          onClick={() => {
            togglePublish.mutate({ showId });
          }}
        >
          {published ? 'Unpublish' : '✓ Approve & Publish'}
        </button>

        {totalStalls > 0 && (
          <button
            type="button"
            disabled={autoAssign.isPending}
            className={ghostButtonClass}
            onClick={() => {
              autoAssign.mutate({ showId });
            }}
          >
            {autoAssign.isPending ? 'Assigning…' : 'Auto-assign horses to empty stalls'}
          </button>
        )}
      </div>

      <Card className="mb-[18px] p-[18px_20px_20px] print:hidden">
        <div className="mb-2.5 text-[10px] font-bold uppercase tracking-[.14em] text-[#6E7C76]">
          Stables
        </div>

        {savedLocations.length > 0 && (
          <div className="mb-2.5 max-w-[340px]">
            <label htmlFor="sc-saved-location" className={SM_LABEL}>
              Add stables from a saved location
            </label>
            <select
              id="sc-saved-location"
              ref={savedLocationSelectRef}
              defaultValue=""
              disabled={applySavedLocation.isPending}
              className={SM_SELECT}
              onChange={(event) => {
                const venueId = event.target.value;
                if (savedLocationSelectRef.current) savedLocationSelectRef.current.value = '';
                if (venueId) applySavedLocation.mutate({ showId, venueId });
              }}
            >
              <option value="">— choose a saved location —</option>
              {savedLocations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} ({loc.stableCount} stable{loc.stableCount === 1 ? '' : 's'})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="mb-3.5 w-[160px]">
          <label htmlFor="sc-stable-count" className={SM_LABEL}>
            Number of stables
          </label>
          <input
            id="sc-stable-count"
            ref={stableCountRef}
            type="number"
            min={0}
            max={MAX_STABLES}
            defaultValue={chart.stables.length}
            className={SM_INPUT}
            onBlur={(event) => {
              const count = Math.max(0, Math.min(MAX_STABLES, parseInt(event.target.value, 10) || 0));
              if (count !== chart.stables.length) setCount.mutate({ showId, count });
            }}
          />
        </div>

        {chart.stables.map((stable) => (
          <StableConfigRow key={stable.id} showId={showId} stable={stable} />
        ))}

        {chart.stables.length === 0 && (
          <p className="mt-2.5 text-[13px] italic text-[#7A8781]">
            Set &ldquo;Number of stables&rdquo; above to get started.
          </p>
        )}
      </Card>

      {totalStalls > 0 &&
        chart.stables.map((stable) => {
          if (stable.stalls.length === 0) return null;
          const rows = splitStallsIntoRows(stable.stalls, stable.rowCount);
          return (
            <Card key={stable.id} className="mb-4 p-[18px_20px_20px] print:hidden">
              <div className="mb-3 text-[10px] font-bold uppercase tracking-[.14em] text-[#6E7C76]">
                {stable.name} — {stable.stalls.length} stalls
              </div>
              {rows.map((rowStalls, i) => (
                <div key={`${stable.id}-row-${String(i)}`} className="mb-2 flex flex-wrap gap-2">
                  {rowStalls.map((stall) => (
                    <StallBox key={stall.id} showId={showId} stableId={stable.id} stall={stall} />
                  ))}
                </div>
              ))}
            </Card>
          );
        })}

      <StableChartPrintView showName={showName} chart={chart} />
    </div>
  );
}

/**
 * A dedicated print view — one page per stable — ported from showstaff.html's
 * printStableChart (~14154). Always in the DOM (`hidden print:block`) rather
 * than rendered into a portal on demand: `window.print()` triggers the
 * browser's own print dialog against whatever's currently in the DOM, so
 * this only has to be visible during that dialog, not before.
 */
function StableChartPrintView({
  showName,
  chart,
}: {
  showName: string;
  chart: StableChartPageData['chart'];
}) {
  const printable = chart.stables.filter((s) => s.stalls.length > 0);
  if (printable.length === 0) return null;

  return (
    <div className="hidden print:block">
      {printable.map((stable, i) => (
        <div
          key={stable.id}
          className="p-10"
          style={{ pageBreakAfter: i < printable.length - 1 ? 'always' : 'auto' }}
        >
          <h1 className="text-[32px] font-bold">
            {showName} — {stable.name}
          </h1>
          <p className="mb-6 text-base text-[#555]">
            {stable.stalls.length} stalls · printed {new Date().toLocaleDateString()}
          </p>
          <div className="grid grid-cols-4 gap-4">
            {stable.stalls.map((stall) => {
              const occupied = !!(stall.horseId ?? stall.horseName);
              return (
                <div
                  key={stall.id}
                  className="rounded-lg border border-[#CCC] p-3"
                  style={{ pageBreakInside: 'avoid' }}
                >
                  <div className="text-[34px] font-extrabold leading-none">{stall.label}</div>
                  {stall.closed ? (
                    <div className="text-lg font-bold text-[#888]">Closed</div>
                  ) : occupied ? (
                    <>
                      <div className="text-xl">{truncateHorseName(stall.riderName ?? '')}</div>
                      <div className="text-[22px] font-bold">{truncateHorseName(stall.horseName ?? '')}</div>
                      <div className="text-base">Shavings owed: {stall.shavings}</div>
                    </>
                  ) : (
                    <div className="text-lg text-[#888]">Empty</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
