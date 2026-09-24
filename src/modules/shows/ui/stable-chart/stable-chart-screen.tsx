'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { ScreenTitle, ScreenLede, Card } from '@/shared/ui/organizer/card';
import { StatusPill } from '@/shared/ui/organizer/status-pill';
import { ghostButtonClass, primaryButtonClass } from '@/shared/ui/organizer/buttons';
import { Button } from '@/shared/ui/shadcn/button';
import { Input } from '@/shared/ui/shadcn/input';
import { Label } from '@/shared/ui/shadcn/label';
import { IconPrinter } from '@/shared/ui/organizer/icons';
import { fa } from '@/shared/lib/organizer-theme';
import { cn } from '@/shared/lib/utils';
import {
  parseStallDndId,
  findStallById,
  parseGroupDndId,
  parseStableDropId,
} from '@/modules/shows/utils/stall-dnd-id';
import { MAX_STABLES } from '@/modules/shows/constants';
import { SM_LABEL, SM_INPUT, SM_SELECT } from '@/modules/shows/ui/show-manager/tokens';
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
}: {
  data: StableChartPageData;
  arrivals: ArrivalDepartureRow[];
  showEndDate: string | null;
  publicId?: string;
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
  const published = chart.status === 'published';

  return (
    <div className="text-ink-deep font-[family-name:var(--font-ar)]">
      <div className="mb-4 flex flex-wrap items-center gap-2.5 print:hidden">
        <Link href={`/dashboard/horses?show=${publicId ?? showId}`} className={ghostButtonClass}>
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
            {occupied} occupied · {availableCount} available
            {reservedCount > 0 && ` · ${String(reservedCount)} reserved`}
            {tackCount > 0 && ` · ${String(tackCount)} tack`}
            {holdCount > 0 && ` · ${String(holdCount)} hold`}
            {closedCount > 0 && ` · ${String(closedCount)} unusable`} · {totalStalls} total stalls
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

      <div className="mb-5">
        <ArrivalsDeparturesPanel rows={arrivals} showEndDate={showEndDate} />
      </div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <StablingGroupsSidebar groups={groups} />

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
