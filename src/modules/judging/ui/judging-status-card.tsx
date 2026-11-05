'use client';

import { useEffect, useState } from 'react';
import { scheduleDelta, type ScheduleStatus } from '@/shared/lib/schedule-delta';
import { FA_BTN, FA_MUTED, FaCard, Pill, type PillTone } from '@/shared/ui/organizer/fa-page';
import type { TodayPanelContact } from '@/modules/judging/types';
import type { RingSummary } from '@/modules/judging/utils/build-today-snapshot';
import { formatClassTime } from '@/modules/judging/utils/format-class-time';
import { PeopleIcon } from '@/modules/judging/ui/people-icon';
import { todayRingLabel } from '@/modules/judging/utils/today-ring-label';

/** Ticking wall-clock time. Null until mounted — a server-rendered time never
 * matches the browser's. */
function useNow(): Date | null {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => {
      setNow(new Date());
    };
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);
  return now;
}

export function LiveClock({ className }: { className?: string }) {
  const now = useNow();
  return (
    <span className={className} suppressHydrationWarning>
      {now
        ? now.toLocaleTimeString(undefined, {
            hour: 'numeric',
            minute: '2-digit',
            second: '2-digit',
          })
        : '—:—:—'}
    </span>
  );
}

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

/** Today's rings at a glance: per ring, the live pace of the class running
 * there (ahead / behind schedule), or the day's line-up before it starts. */
export function RingPaceCard({ ringSummaries }: { ringSummaries: RingSummary[] }) {
  const now = useNow();
  if (ringSummaries.length === 0) return null;

  return (
    <FaCard className="mb-4 flex flex-col gap-2.5">
      {ringSummaries.map((r) => {
        const pace = paceFor(r, now);
        return (
          <div key={r.ring} className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="min-w-[140px] text-[15px] font-bold text-[#0D2C23]">{r.ring}</span>
            {pace ? (
              <>
                <Pill tone={PACE_TONE[pace.status]} className="flex-none">
                  {pace.headline}
                </Pill>
                <span className={FA_MUTED}>{pace.sub}</span>
              </>
            ) : (
              <span className={FA_MUTED}>
                {r.active
                  ? `${plural(r.classes, 'class', 'classes')} today${r.firstTime ? ` · first at ${formatClassTime(r.firstTime) ?? r.firstTime}` : ''}`
                  : 'Done for today'}
              </span>
            )}
          </div>
        );
      })}
    </FaCard>
  );
}

const PACE_TONE: Record<ScheduleStatus, PillTone> = {
  ahead: 'green',
  yellow: 'yellow',
  pink: 'red',
  red: 'red',
};

function plural(n: number, one: string, many: string) {
  return `${String(n)} ${n === 1 ? one : many}`;
}

/** Live pace of the ring's running class — the same rule the scoring screen
 * uses (scheduled start + rides done × ride minutes). Before that class's
 * start there's no pace yet, so the row shows the day's line-up instead. */
function paceFor(
  ring: RingSummary,
  now: Date | null,
): { status: ScheduleStatus; headline: string; sub: string } | null {
  if (!now || !ring.active?.time) return null;

  // Class time is wall-clock at the show, so read it in the show's zone.
  const delta = scheduleDelta(ring.active.time.slice(0, 5), ring.active.pos, now, ring.timeZone);
  if (!delta) return null;
  // Before the class's start with nobody ridden there's no pace yet.
  if (delta.deltaMin < 0 && ring.active.pos === 0) return null;
  const mins = Math.abs(delta.deltaMin);
  return {
    status: delta.status,
    headline:
      delta.deltaMin === 0 ? 'on time' : `${delta.deltaMin > 0 ? '+' : '−'}${String(mins)} min`,
    sub:
      delta.deltaMin === 0
        ? 'on schedule'
        : delta.deltaMin > 0
          ? 'behind schedule'
          : 'ahead of schedule',
  };
}
