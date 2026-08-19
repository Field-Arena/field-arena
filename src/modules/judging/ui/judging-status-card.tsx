'use client';

import { useState } from 'react';
import { LiveClock } from '@/shared/ui/organizer/live-clock';
import { Button } from '@/shared/ui/shadcn/button';
import type { TodayPanelContact } from '@/modules/judging/data/queries';
import { PeopleIcon } from '@/modules/judging/ui/people-icon';

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
 *
 * `rings` can be empty even with real assignments today — a class only ends
 * up in it once an organizer has set that class's ring/location, which
 * nothing requires. `assignmentsToday` is the honest fallback: it comes
 * straight from today's assignment count, not from whether a ring name
 * happens to exist, so "No assignments today" only ever says that when it's
 * true.
 */
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
          className="h-auto bg-white text-ink-deep hover:border-gold hover:bg-white inline-flex items-center gap-[7px] rounded-[9px] border border-[#D9E1DD] px-[15px] py-2.5 text-[12.5px] font-semibold transition-colors"
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
