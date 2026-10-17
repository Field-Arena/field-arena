'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { PrinterIcon } from 'lucide-react';
import {
  CardTitle,
  FA_BTN,
  FA_BTN_PRIMARY,
  FA_INPUT,
  FA_MUTED,
  FA_SELECT,
  FaCard,
  PageHeader,
  Pill,
  StatBox,
  StatGrid,
} from '@/shared/ui/organizer/fa-page';
import { cn } from '@/shared/lib/utils';
import {
  parseStallDndId,
  findStallById,
  parseGroupDndId,
  parseStableDropId,
} from '@/modules/shows/utils/stall-dnd-id';
import { MAX_STABLES } from '@/modules/shows/constants';
import {
  useSetStableCount,
  useToggleStableChartStatus,
  useAutoAssignStableStalls,
  useApplySavedLocationStables,
  useReassignStall,
  useSwapStalls,
  useAssignGroupToStable,
} from '@/modules/shows/hooks/use-stable-chart-mutations';
import { StableConfigRow } from '@/modules/shows/ui/stable-chart/stable-config-row';
import { StableDropCard } from '@/modules/shows/ui/stable-chart/stable-drop-card';
import { StableChartPrintView } from '@/modules/shows/ui/stable-chart/stable-chart-print-view';
import { StablingGroupsSidebar } from '@/modules/shows/ui/stable-chart/stabling-groups-sidebar';
import { ArrivalsDeparturesPanel } from '@/modules/shows/ui/stable-chart/arrivals-departures-panel';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import type { StableChartPageData } from '@/modules/shows/data/stable-chart-queries';
import type { ArrivalDepartureRow } from '@/modules/shows/data/arrivals-departures-queries';

export function StableChartScreen({
  data,
  arrivals,
  showEndDate,
  publicId,
  from = null,
}: {
  data: StableChartPageData;
  arrivals: ArrivalDepartureRow[];
  showEndDate: string | null;
  publicId?: string;
  /** Where the user came from (?from=…). The back button only appears for
   * the Horses screen, which is a sibling page; from Show Manager setup it
   * offers a way back to the Venue section instead of "Back to Horses",
   * which made no sense there. */
  from?: 'horses' | 'setup' | null;
}) {
  const { showId, showName, chart, savedLocations, groups } = data;

  const setCount = useSetStableCount();
  const togglePublish = useToggleStableChartStatus();
  const autoAssign = useAutoAssignStableStalls();
  const applySavedLocation = useApplySavedLocationStables();
  const reassign = useReassignStall();
  const swap = useSwapStalls();

  const stableCountRef = useRef<HTMLInputElement>(null);
  const savedLocationSelectRef = useRef<HTMLSelectElement>(null);

  const assignGroup = useAssignGroupToStable();

  const [pendingSwap, setPendingSwap] = useState<{
    from: { stableId: string; stallId: string };
    to: { stableId: string; stallId: string; horseName: string | null };
  } | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const activeId = String(active.id);
    const overId = String(over.id);

    const trainerKey = parseGroupDndId(activeId);
    if (trainerKey) {
      const targetStableId = parseStableDropId(overId) ?? parseStallDndId(overId)?.stableId;
      if (targetStableId) {
        assignGroup.mutate({ showId, trainerKey, targetStableId });
      }
      return;
    }

    const from = parseStallDndId(activeId);
    const to = parseStallDndId(overId);
    if (!from || !to) return;
    const toStall = findStallById(chart.stables, to.stableId, to.stallId);
    if (!toStall) return;

    if (toStall.status === 'available') {
      reassign.mutate({
        showId,
        fromStableId: from.stableId,
        fromStallId: from.stallId,
        toStableId: to.stableId,
        toStallId: to.stallId,
      });
    } else if (toStall.status === 'occupied') {
      setPendingSwap({ from, to: { ...to, horseName: toStall.horseName } });
    }
  }

  const allStalls = chart.stables.flatMap((b) => b.stalls);
  const totalStalls = allStalls.length;
  const countOf = (status: (typeof allStalls)[number]['status']) =>
    allStalls.filter((s) => s.status === status).length;
  const occupied = countOf('occupied');
  const availableCount = countOf('available');
  const closedCount = countOf('unusable');
  const reservedCount = countOf('reserved');
  const tackCount = countOf('tack');
  const holdCount = countOf('hold');
  const actualPublished = chart.status === 'published';

  // actualPublished only flips once router.refresh() lands -- flip
  // instantly on click instead, revert on error.
  const [optimisticPublished, setOptimisticPublished] = useState<boolean | null>(null);
  const [prevPublished, setPrevPublished] = useState(actualPublished);
  if (actualPublished !== prevPublished) {
    setPrevPublished(actualPublished);
    setOptimisticPublished(null);
  }
  const published = optimisticPublished ?? actualPublished;

  return (
    <div className="text-ink-deep font-[family-name:var(--font-ar)]">
      <PageHeader
        className="print:hidden"
        eyebrow={
          <span className="inline-flex flex-wrap items-center gap-2">
            {showName} · set the stables, click a stall to rename it, then approve to publish
            {published ? (
              <Pill tone="green">✓ Published — visible to everyone</Pill>
            ) : (
              <Pill tone="yellow">Draft — not published yet</Pill>
            )}
          </span>
        }
        title="Stable chart"
        actions={
          <>
            {from === 'horses' && (
              <Link
                href={`/dashboard/horses?show=${publicId ?? showId}`}
                prefetch={false}
                className={FA_BTN}
              >
                🐴 Back to Horses
              </Link>
            )}
            {from === 'setup' && (
              <Link
                href={`/dashboard/shows/${publicId ?? showId}#venue`}
                prefetch={false}
                className={FA_BTN}
              >
                ← Back to Show Manager
              </Link>
            )}
            {totalStalls > 0 && (
              <button
                type="button"
                className={FA_BTN}
                onClick={() => {
                  window.print();
                }}
              >
                <PrinterIcon className="size-4" aria-hidden /> Print
              </button>
            )}
            {totalStalls > 0 && (
              <button
                type="button"
                disabled={autoAssign.isPending}
                className={FA_BTN}
                onClick={() => {
                  autoAssign.mutate({ showId });
                }}
              >
                {autoAssign.isPending ? 'Assigning…' : 'Auto-assign horses to empty stalls'}
              </button>
            )}
            <button
              type="button"
              disabled={togglePublish.isPending}
              className={published ? FA_BTN : FA_BTN_PRIMARY}
              onClick={() => {
                setOptimisticPublished(!published);
                togglePublish.mutate(
                  { showId },
                  {
                    onError: () => {
                      setOptimisticPublished(null);
                    },
                  },
                );
              }}
            >
              {published ? 'Unpublish' : '✓ Approve & publish'}
            </button>
          </>
        }
      />

      {totalStalls > 0 && (
        <div className="print:hidden">
          <StatGrid cols={4}>
            <StatBox
              label="Stalls"
              value={totalStalls}
              note={`${String(chart.stables.length)} stables`}
            />
            <StatBox label="Occupied" value={occupied} tone="green" />
            <StatBox label="Available" value={availableCount} />
            <StatBox
              label="Held back"
              value={reservedCount + tackCount + holdCount + closedCount}
              tone={closedCount > 0 ? 'red' : 'default'}
              note={[
                `${String(reservedCount)} reserved`,
                `${String(tackCount)} tack`,
                `${String(holdCount)} hold`,
                `${String(closedCount)} unusable`,
              ].join(' · ')}
            />
          </StatGrid>
        </div>
      )}

      <div className="mb-4">
        <ArrivalsDeparturesPanel rows={arrivals} showEndDate={showEndDate} />
      </div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <StablingGroupsSidebar groups={groups} />

        <FaCard className="mb-4 print:hidden">
          <CardTitle className="mb-3">Stables</CardTitle>

          {savedLocations.length > 0 && (
            <div className="mb-2.5 max-w-[340px]">
              <label htmlFor="sc-saved-location" className={cn(FA_MUTED, 'mb-1 block')}>
                Add stables from a saved location
              </label>
              <select
                id="sc-saved-location"
                ref={savedLocationSelectRef}
                defaultValue=""
                disabled={applySavedLocation.isPending}
                className={cn(FA_SELECT, 'w-full')}
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
            <label htmlFor="sc-stable-count" className={cn(FA_MUTED, 'mb-1 block')}>
              Number of stables
            </label>
            <input
              id="sc-stable-count"
              ref={stableCountRef}
              type="number"
              min={0}
              max={MAX_STABLES}
              defaultValue={chart.stables.length}
              className={cn(FA_INPUT, 'w-full')}
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
            <p className="mt-2.5 text-[13px] font-semibold text-[#5A6B63]">
              Set &ldquo;Number of stables&rdquo; above to get started.
            </p>
          )}
        </FaCard>

        {totalStalls > 0 &&
          chart.stables.map((stable) => {
            if (stable.stalls.length === 0) return null;
            return (
              <StableDropCard
                key={stable.id}
                showId={showId}
                stable={stable}
                allStables={chart.stables}
              />
            );
          })}
      </DndContext>

      <StableChartPrintView showName={showName} chart={chart} />

      <ConfirmDialog
        open={pendingSwap !== null}
        onOpenChange={(open) => {
          if (!open) setPendingSwap(null);
        }}
        title="Swap horses?"
        description={`That stall is occupied by ${pendingSwap?.to.horseName ?? 'a horse'}. Swap the two horses' stalls?`}
        confirmLabel={swap.isPending ? 'Swapping…' : 'Swap'}
        pending={swap.isPending}
        onConfirm={() => {
          if (!pendingSwap) return;
          swap.mutate(
            {
              showId,
              stableAId: pendingSwap.from.stableId,
              stallAId: pendingSwap.from.stallId,
              stableBId: pendingSwap.to.stableId,
              stallBId: pendingSwap.to.stallId,
            },
            {
              onSuccess: () => {
                setPendingSwap(null);
              },
            },
          );
        }}
      />
    </div>
  );
}
