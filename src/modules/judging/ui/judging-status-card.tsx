'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { scheduleDelta, type ScheduleStatus } from '@/shared/lib/schedule-delta';
import type { RingSummary } from '@/modules/judging/utils/build-today-snapshot';
import type { TodayPanelContact } from '@/modules/judging/types';
import { formatClassTime } from '@/modules/judging/utils/format-class-time';
import { PeopleIcon } from '@/modules/judging/ui/people-icon';

/** The redesign's judge clock strip — live time on the dark block, today's
 * rings beside it — plus the results / panel shortcuts under it. */
export function JudgingStatusCard({
  ringSummaries,
  contacts,
  assignmentsToday,
  showResultsLink,
}: {
  ringSummaries: RingSummary[];
  contacts: TodayPanelContact[];
  assignmentsToday: number;
  showResultsLink: boolean;
}) {
  const [open, setOpen] = useState(false);
  // Null until mounted — a server-rendered time never matches the browser's.
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

  const panelText =
    contacts.length > 0
      ? contacts
          .map(
            (c) =>
              `${c.name} is ${c.role === 'judge' ? 'judging' : 'scribing'}${c.position ? ` at ${c.position}` : ''}`,
          )
          .join('; ')
      : "You're the only one on today's panel.";

  return (
    <>
      <div className="fa-card mb-4 flex flex-wrap items-stretch !overflow-hidden">
        <div className="flex min-w-[180px] items-center bg-[#0E3627] px-6 py-4">
          <span className="font-mono text-[24px] font-bold tracking-[.02em] text-[#8EF0BF]">
            {now
              ? now.toLocaleTimeString(undefined, {
                  hour: 'numeric',
                  minute: '2-digit',
                  second: '2-digit',
                })
              : '—:—:—'}
          </span>
        </div>
        {assignmentsToday === 0 ? (
          <div className="flex flex-1 items-center justify-center bg-[var(--fa-surface-2)] px-5 py-4 text-[13.5px] font-semibold text-[var(--fa-ink-3)]">
            No assignments today
          </div>
        ) : (
          ringSummaries.map((r) => {
            const pace = paceFor(r, now);
            const tone = pace ? PACE_TONE[pace.status] : NEUTRAL_TONE;
            return (
              <div
                key={r.ring}
                className="flex min-w-[200px] flex-1 flex-col items-center justify-center border-l border-[var(--fa-line-soft)] px-5 py-3 text-center"
                style={{ background: tone.bg }}
              >
                <b className="text-[14px]" style={{ color: tone.fg }}>
                  {r.ring}
                  {pace ? ` · ${pace.headline}` : ''}
                </b>
                <span className="text-[12px] font-semibold" style={{ color: tone.fg }}>
                  {pace
                    ? pace.sub
                    : r.active
                      ? `${plural(r.classes, 'class', 'classes')} today${r.firstTime ? ` · first at ${formatClassTime(r.firstTime) ?? r.firstTime}` : ''}`
                      : 'Done for today'}
                </span>
              </div>
            );
          })
        )}
      </div>

      <div className="mb-7 flex flex-wrap items-center gap-2">
        {showResultsLink && (
          <Link href="/dashboard/judging/results" prefetch={false} className="fa-btn fa-btn-ghost">
            <svg
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 21h8M12 17v4M7 4h10v4a5 5 0 01-10 0V4zM17 5h3v2a3 3 0 01-3 3M7 5H4v2a3 3 0 003 3"
              />
            </svg>
            View results
          </Link>
        )}
        <div className="relative">
          <button
            type="button"
            className="fa-btn fa-btn-ghost"
            aria-expanded={open}
            onClick={() => {
              setOpen((o) => !o);
            }}
          >
            <PeopleIcon />
            Who&apos;s on the panel
          </button>
          {open && (
            <span className="absolute top-[calc(100%+8px)] left-0 z-10 w-64 rounded-[10px] bg-[#0E3627] p-[12px_14px] text-[12.5px] leading-[1.5] font-medium text-[#EAFFF3] shadow-[0_14px_40px_rgba(16,24,40,.14)]">
              {panelText}
            </span>
          )}
        </div>
      </div>
    </>
  );
}

const PACE_TONE: Record<ScheduleStatus, { bg: string; fg: string }> = {
  ahead: { bg: 'var(--fa-emerald-tint)', fg: 'var(--fa-emerald)' },
  yellow: { bg: 'var(--fa-amber-tint)', fg: 'var(--fa-amber)' },
  pink: { bg: 'var(--fa-rose-tint)', fg: 'var(--fa-rose)' },
  red: { bg: 'var(--fa-red-tint)', fg: 'var(--fa-red)' },
};
const NEUTRAL_TONE = { bg: 'var(--fa-brand-tint)', fg: 'var(--fa-brand-ink)' };

function plural(n: number, one: string, many: string) {
  return `${String(n)} ${n === 1 ? one : many}`;
}

/** Live pace of the ring's running class — the same rule the scoring screen
 * uses (scheduled start + rides done × ride minutes). Before that class's
 * start there's no pace yet, so the tile shows the day's line-up instead. */
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
