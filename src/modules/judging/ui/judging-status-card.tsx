'use client';

import { useState } from 'react';
import { LiveClock } from '@/shared/ui/organizer/live-clock';
import { Button } from '@/shared/ui/shadcn/button';
import type { TodayPanelContact } from '@/modules/judging/data/queries';
import { PeopleIcon } from '@/modules/judging/ui/people-icon';

export function JudgingStatusCard({
  rings,
  contacts,
  assignmentsToday,
}: {
  rings: string[];
  contacts: TodayPanelContact[];
  assignmentsToday: number;
}) {
  const [open, setOpen] = useState(false);

  const ringLabel =
    rings.length > 0
      ? rings.join(', ')
      : assignmentsToday > 0
        ? `${String(assignmentsToday)} assignment${assignmentsToday === 1 ? '' : 's'} today — ring not set`
        : 'No assignments today';

  const tooltipText =
    contacts.length > 0
      ? contacts
          .map(
            (c) =>
              `${c.name} is ${c.role === 'judge' ? 'judging' : 'scribing'}${c.position ? ` at ${c.position}` : ''}`,
          )
          .join('; ')
      : "You're the only one on today's panel.";

  return (
    <div className="mb-7 flex flex-wrap items-center gap-6 rounded-[14px] border border-[#E9EDEB] bg-white p-[18px_22px] shadow-[0_1px_2px_rgba(16,40,32,.04),0_12px_30px_-16px_rgba(16,40,32,.13)]">
      <LiveClock className="text-ink-deep flex-none font-mono text-[26px] font-semibold tracking-[.03em]" />

      <span className="h-[30px] w-px flex-none bg-[#E9EDEB]" />

      <span className="flex min-w-[160px] flex-1 flex-col gap-0.5">
        <span className="text-[10px] font-bold tracking-[.12em] text-[#7A8781] uppercase">
          Today
        </span>
        <span className="text-ink-deep text-[15px] font-bold">{ringLabel}</span>
      </span>

      <div className="relative flex-none">
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setOpen((o) => !o);
          }}
          className="text-ink-deep hover:border-gold inline-flex h-auto items-center gap-[7px] rounded-[9px] border border-[#D9E1DD] bg-white px-[15px] py-2.5 text-[12.5px] font-semibold transition-colors hover:bg-white"
        >
          <PeopleIcon />
          Who&apos;s on the panel
        </Button>

        {open && (
          <span className="absolute top-[calc(100%+8px)] right-0 z-10 w-60 rounded-[10px] bg-[#0D2C23] p-[12px_14px] text-[12.5px] leading-[1.5] font-medium text-[#F5F7F6] shadow-[0_14px_30px_rgba(9,26,21,.35)]">
            {tooltipText}
          </span>
        )}
      </div>
    </div>
  );
}
