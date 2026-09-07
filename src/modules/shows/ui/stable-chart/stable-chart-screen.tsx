'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { ScreenTitle, ScreenLede, Card } from '@/shared/ui/organizer/card';
import { StatusPill } from '@/shared/ui/organizer/status-pill';
import { ghostButtonClass, primaryButtonClass } from '@/shared/ui/organizer/buttons';
import { Button } from '@/shared/ui/shadcn/button';
import { Input } from '@/shared/ui/shadcn/input';
import { Label } from '@/shared/ui/shadcn/label';
import { IconPrinter } from '@/shared/ui/organizer/icons';
import { fa } from '@/shared/lib/organizer-theme';
import { cn } from '@/shared/lib/utils';
import { splitStallsIntoRows } from '@/modules/shows/utils/split-stalls-into-rows';
import { MAX_STABLES } from '@/modules/shows/constants';
import { SM_LABEL, SM_INPUT, SM_SELECT } from '@/modules/shows/ui/show-manager/tokens';
import {
  useSetStableCount,
  useToggleStableChartStatus,
  useAutoAssignStableStalls,
  useApplySavedLocationStables,
} from '@/modules/shows/hooks/use-stable-chart-mutations';
import { StableConfigRow } from '@/modules/shows/ui/stable-chart/stable-config-row';
import { StallBox } from '@/modules/shows/ui/stable-chart/stall-box';
import { StableChartPrintView } from '@/modules/shows/ui/stable-chart/stable-chart-print-view';
import type { StableChartPageData } from '@/modules/shows/data/stable-chart-queries';

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
    0,
  );
  const closedCount = chart.stables.reduce(
    (n, b) => n + b.stalls.filter((s) => s.closed).length,
    0,
  );
  const published = chart.status === 'published';

  return (
    <div className="text-ink-deep font-[family-name:var(--font-ar)]">
      <div className="mb-4 flex flex-wrap items-center gap-2.5 print:hidden">
        <Link href={`/dashboard/horses?show=${showId}`} className={ghostButtonClass}>
          🐴 Back to Horses
        </Link>
        {totalStalls > 0 && (
          <Button
            type="button"
            variant="ghost"
            className={cn('h-auto', ghostButtonClass)}
            onClick={() => {
              window.print();
            }}
          >
            <IconPrinter size={14} /> Print
          </Button>
        )}
      </div>

      <div className="mb-5 print:hidden">
        <ScreenTitle className="mb-1.5">Stable Chart — {showName}</ScreenTitle>
        <ScreenLede className="mb-0">
          Set the stables and stalls below, click any stall to rename it, then approve to publish
          the chart.
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

        <Button
          type="button"
          variant="ghost"
          disabled={togglePublish.isPending}
          className={cn('h-auto', primaryButtonClass)}
          onClick={() => {
            togglePublish.mutate({ showId });
          }}
        >
          {published ? 'Unpublish' : '✓ Approve & Publish'}
        </Button>

        {totalStalls > 0 && (
          <Button
            type="button"
            variant="ghost"
            disabled={autoAssign.isPending}
            className={cn('h-auto', ghostButtonClass)}
            onClick={() => {
              autoAssign.mutate({ showId });
            }}
          >
            {autoAssign.isPending ? 'Assigning…' : 'Auto-assign horses to empty stalls'}
          </Button>
        )}
      </div>

      <Card className="mb-[18px] p-[18px_20px_20px] print:hidden">
        <div className="mb-2.5 text-[10px] font-bold tracking-[.14em] text-[#6E7C76] uppercase">
          Stables
        </div>

        {savedLocations.length > 0 && (
          <div className="mb-2.5 max-w-[340px]">
            <Label htmlFor="sc-saved-location" className={SM_LABEL}>
              Add stables from a saved location
            </Label>
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
          <Label htmlFor="sc-stable-count" className={SM_LABEL}>
            Number of stables
          </Label>
          <Input
            id="sc-stable-count"
            ref={stableCountRef}
            type="number"
            min={0}
            max={MAX_STABLES}
            defaultValue={chart.stables.length}
            className={cn('h-auto', SM_INPUT)}
            onBlur={(event) => {
              const count = Math.max(
                0,
                Math.min(MAX_STABLES, parseInt(event.target.value, 10) || 0),
              );
              if (count !== chart.stables.length) setCount.mutate({ showId, count });
            }}
          />
        </div>

        {chart.stables.map((stable) => (
          <StableConfigRow key={stable.id} showId={showId} stable={stable} />
        ))}

        {chart.stables.length === 0 && (
          <p className="mt-2.5 text-[13px] text-[#7A8781] italic">
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
              <div className="mb-3 text-[10px] font-bold tracking-[.14em] text-[#6E7C76] uppercase">
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
