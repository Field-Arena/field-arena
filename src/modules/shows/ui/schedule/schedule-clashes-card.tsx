'use client';

import { useState } from 'react';
import { Card } from '@/shared/ui/organizer/card';
import { cn } from '@/shared/lib/utils';
import { SM_CARD_PAD } from '../show-manager/tokens';
import type { MasterSchedule } from '../../schedule-engine';

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
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
        }}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2.5 text-left"
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
      </button>

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

function ClashGroup({
  heading,
  blurb,
  rows,
}: {
  heading: string;
  blurb: string;
  rows: MasterSchedule['conflicts']['avoided'];
}) {
  return (
    <div>
      <div className="text-[12.5px] font-bold text-forest">
        {heading} · {rows.length}
      </div>
      <p className="mb-2 text-[12px] leading-[1.5] text-[#98A29D]">{blurb}</p>

      <div className="flex flex-col">
        {rows.map((clash, i) => (
          <div
            key={`${clash.riderNum}-${clash.classA}-${clash.classB}-${String(i)}`}
            className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 border-b border-[#F1F4F3] py-[7px] text-[12.5px] last:border-b-0"
          >
            <span className="font-semibold">#{clash.riderNum}</span>
            <span className="font-semibold">{clash.riderName}</span>
            <span className="text-[#7A8781]">on {clash.horse}</span>
            <span className="basis-full text-[12px] text-[#6E7C76] sm:basis-auto sm:before:mx-1 sm:before:content-['—']">
              {clash.classA} <span className="text-[#98A29D]">({clash.ringA})</span> vs{' '}
              {clash.classB} <span className="text-[#98A29D]">({clash.ringB})</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
