'use client';

import { useState } from 'react';
import { LiveClock } from '@/shared/ui/organizer/live-clock';
import { FA_BTN, FaCard } from '@/shared/ui/organizer/fa-page';
import type { TodayPanelContact } from '@/modules/judging/data/queries';
import { PeopleIcon } from '@/modules/judging/ui/people-icon';
import { todayRingLabel } from '@/modules/judging/utils/today-ring-label';

export function PanelPopoverButton({ contacts }: { contacts: TodayPanelContact[] }) {
  const [open, setOpen] = useState(false);

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
    <div className="relative flex-none">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => {
          setOpen((o) => !o);
        }}
        className={FA_BTN}
      >
        <PeopleIcon />
        Who&apos;s on the panel
      </button>

      {open && (
        <span className="absolute top-[calc(100%+8px)] right-0 z-10 w-60 rounded-[10px] bg-[#0D2C23] p-[12px_14px] text-[12.5px] leading-[1.5] font-medium text-[#F5F7F6] shadow-[0_14px_30px_rgba(9,26,21,.35)]">
          {tooltipText}
        </span>
      )}
    </div>
  );
}

export function JudgingStatusCard({
  rings,
  contacts,
  assignmentsToday,
}: {
  rings: string[];
  contacts: TodayPanelContact[];
  assignmentsToday: number;
}) {
  return (
    <FaCard className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-3">
      <LiveClock className="flex-none font-mono text-[24px] font-bold tracking-[.03em] text-[#0D2C23]" />

      <span className="h-[30px] w-px flex-none bg-[#D9E1DD]" />

      <span className="flex min-w-[160px] flex-1 flex-col gap-0.5">
        <span className="text-[12.5px] font-semibold text-[#5A6B63]">Today</span>
        <span className="text-[15px] font-bold text-[#0D2C23]">
          {todayRingLabel(rings, assignmentsToday)}
        </span>
      </span>

      <PanelPopoverButton contacts={contacts} />
    </FaCard>
  );
}
