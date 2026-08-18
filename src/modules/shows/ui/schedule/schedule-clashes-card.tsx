'use client';

import { useState } from 'react';
import { Card } from '@/shared/ui/organizer/card';
import { Button } from '@/shared/ui/shadcn/button';
import { cn } from '@/shared/lib/utils';
import { SM_CARD_PAD } from '@/modules/shows/ui/show-manager/tokens';
import type { MasterSchedule } from '@/modules/shows/schedule-engine';
import { ClashGroup } from '@/modules/shows/ui/schedule/schedule-clash-group';

/**
 * Every rider double-booking the scheduler ran into, and what it did about it.
 *
 * The counts were already on the toolbar; this is the detail behind them —
 * which rider, which horse, and which two classes in which two rings. Without
 * it "3 clashes avoided" is a number an organizer has to take on trust, and the
 * one question they actually have is "which of my riders was it?".
 *
 * These are resolved conflicts, not outstanding ones. Nothing in the built
 * schedule is double-booked: the hard rider rule is never violated, so a live
 * red CLASH badge on a ride would be reporting something that cannot happen.
 * What is worth showing is the work the scheduler did — a clash it moved out of
 * the way is a clash the organizer did not spend their evening finding.
 */
export function ScheduleClashesCard({ schedule }: { schedule: MasterSchedule }) {
  const [open, setOpen] = useState(false);

  const avoided = schedule.conflicts.avoided;
  const waited = schedule.conflicts.waited;
  const total = avoided.length + waited.length;

  if (total === 0) return null;

  return (
    <Card className={cn(SM_CARD_PAD, 'mb-4 border-l-4 border-l-[#B23A3A]')}>
      <Button
        type="button"
        variant="ghost"
        onClick={() => {
          setOpen((v) => !v);
        }}
        aria-expanded={open}
        className="h-auto flex w-full items-center justify-between gap-2.5 px-0 py-0 text-left hover:bg-transparent"
      >
        <span className="flex items-center gap-2.5">
          <span className="rounded-[4px] bg-[#FDF0EE] px-2 py-[3px] text-[10.5px] font-bold tracking-[.1em] text-[#B23A3A] uppercase">
            Clash
          </span>
          <span className="font-[family-name:var(--font-nr)] text-[17px] font-semibold text-forest">
            {total} rider {total === 1 ? 'clash' : 'clashes'} resolved
          </span>
        </span>
        <span className="text-[11px] whitespace-nowrap text-[#7A8781]">
          {open ? 'Hide ▲' : 'Show detail ▼'}
        </span>
      </Button>

      {open && (
        <div className="mt-3 flex flex-col gap-4">
          {avoided.length > 0 && (
            <ClashGroup
              heading="Avoided by reordering the ring"
              blurb="The ring's own running order was rotated so the rider got a legal gap. No time was lost."
              rows={avoided}
            />
          )}

          {waited.length > 0 && (
            <ClashGroup
              heading="Resolved by waiting"
              blurb="No reordering could open a legal gap, so the ring held. The class runs longer rather than a rider being double-booked."
              rows={waited}
            />
          )}
        </div>
      )}
    </Card>
  );
}
