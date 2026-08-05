'use client';

import { useState } from 'react';
import { LiveClock } from '@/shared/ui/organizer/live-clock';
import type { TodayPanelContact } from '../data/queries';

/**
 * The clock/ring/panel strip shared by all 4 tabs, ported from Judge
 * Workspace.dc.html's status card — present on "My Assignments", "Panel &
 * Contacts", "Documents" and "History" alike in the design.
 *
 * One deliberate departure from the mock: the "Ring 1 · vs. schedule" slot
 * showed a static "6 min behind schedule" delta. That number implies a live
 * actual-vs-scheduled timing feed, which nothing in this schema records yet
 * (the same gap WorkspaceHeader's own doc comment flags for the organizer
 * dashboard's ring strip) — so this shows today's real ring name(s) instead
 * of a number nobody is actually measuring.
 */
export function JudgingStatusCard({
  rings,
  contacts,
}: {
  rings: string[];
  contacts: TodayPanelContact[];
}) {
  const [open, setOpen] = useState(false);

  const ringLabel = rings.length > 0 ? rings.join(', ') : 'No assignments today';

  const tooltipText =
    contacts.length > 0
      ? contacts
          .map(
            (c) =>
              `${c.name} is ${c.role === 'judge' ? 'judging' : 'scribing'}${c.position ? ` at ${c.position}` : ''}`
          )
          .join('; ')
      : "You're the only one on today's panel.";

  return (
    <div className="mb-7 flex flex-wrap items-center gap-6 rounded-[14px] border border-[#E9EDEB] bg-white p-[18px_22px] shadow-[0_1px_2px_rgba(16,40,32,.04),0_12px_30px_-16px_rgba(16,40,32,.13)]">
      <LiveClock className="flex-none font-mono text-[26px] font-semibold tracking-[.03em] text-ink-deep" />

      <span className="h-[30px] w-px flex-none bg-[#E9EDEB]" />

      <span className="flex min-w-[160px] flex-1 flex-col gap-0.5">
        <span className="text-[10px] font-bold uppercase tracking-[.12em] text-[#7A8781]">
          Today
        </span>
        <span className="text-[15px] font-bold text-ink-deep">{ringLabel}</span>
      </span>

      <div className="relative flex-none">
        <button
          type="button"
          onClick={() => {
            setOpen((o) => !o);
          }}
          className="inline-flex items-center gap-[7px] rounded-[9px] border border-[#D9E1DD] bg-white px-[15px] py-2.5 text-[12.5px] font-semibold text-ink-deep transition-colors hover:border-gold"
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
    </div>
  );
}

function PeopleIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M17 20v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="6" r="4" />
      <path d="M23 20v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
