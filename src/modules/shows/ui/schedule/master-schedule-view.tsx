'use client';

import { useState } from 'react';
import type { MasterScheduleData } from '@/modules/shows/types';
import { AwardsGroupingToggle } from '@/modules/shows/ui/schedule/awards-grouping-toggle';
import { ScheduleKeyCard } from '@/modules/shows/ui/schedule/schedule-key-card';
import { ScheduleRulesCard } from '@/modules/shows/ui/schedule/schedule-rules-card';
import { ScheduleClashesCard } from '@/modules/shows/ui/schedule/schedule-clashes-card';
import { RingSchedule } from '@/modules/shows/ui/schedule/ring-schedule';
import { ScheduleGrid } from '@/modules/shows/ui/schedule/schedule-grid';
import { riderDayFlags } from '@/modules/shows/utils/rider-day-flags';
import {
  SCHEDULE_LEVELS,
  levelOf,
  type ScheduleLevelKey,
} from '@/modules/shows/utils/schedule-level';

function shortDay(startDate: string | null, day: number): string {
  if (!startDate) return `Day ${String(day + 1)}`;
  const d = new Date(`${startDate.slice(0, 10)}T12:00:00`);
  d.setDate(d.getDate() + day);
  const wd = d.toLocaleDateString('en-US', { weekday: 'short' });
  const md = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${wd} · ${md}`;
}

export function MasterScheduleView({ data }: { data: MasterScheduleData }) {
  const { schedule } = data;
  const totalDays = Math.max(1, ...schedule.arenas.flatMap((a) => a.items.map((it) => it.day + 1)));
  const [day, setDay] = useState(0);
  const [hidden, setHidden] = useState<Set<ScheduleLevelKey>>(new Set());
  const flags = riderDayFlags(schedule.arenas);

  const present = new Set(
    schedule.arenas.flatMap((a) =>
      a.items.flatMap((it) => (it.type === 'ride' ? [levelOf(it.label).key] : [])),
    ),
  );
  const legend = SCHEDULE_LEVELS.filter((l) => present.has(l.key));

  // "Waited" is the builder resolving a double-booking by holding a ring
  // until the rider's rest gap has passed — informational, not a conflict.
  const waited = schedule.conflicts.waited;

  function toggleLevel(key: ScheduleLevelKey) {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div>
      <div className="print:hidden">
        <div className="fa-sched-toolbar">
          {totalDays > 1 && (
            <div className="fa-day-tabs">
              {Array.from({ length: totalDays }, (_, i) => i).map((i) => (
                <button
                  key={i}
                  type="button"
                  className={`fa-day-tab ${day === i ? 'fa-active' : ''}`}
                  onClick={() => {
                    setDay(i);
                  }}
                >
                  {shortDay(data.startDate, i)}
                </button>
              ))}
            </div>
          )}
          <span className={`fa-sched-status ${data.published ? '' : 'fa-dirty'}`}>
            <span className="fa-dot" />
            {data.published ? 'Published · in sync' : 'Draft · unpublished'}
          </span>
          <div className="fa-legend">
            {legend.map((l) => (
              <button
                key={l.key}
                type="button"
                className={`fa-lg border-0 bg-transparent ${hidden.has(l.key) ? 'fa-dim' : ''}`}
                aria-pressed={!hidden.has(l.key)}
                title={hidden.has(l.key) ? `Show ${l.label}` : `Fade ${l.label}`}
                onClick={() => {
                  toggleLevel(l.key);
                }}
              >
                <span className="fa-sw" style={{ background: l.color }} />
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {waited[0] && (
          <div className="fa-callout !border-[#CFE3F5] !bg-[var(--fa-sky-tint)] !text-[#0B4F87]">
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
                d="M12 8v4l3 2M12 3a9 9 0 100 18 9 9 0 000-18z"
              />
            </svg>
            <span>
              <b className="!text-[#0B4F87]">Rest gap applied.</b> {waited[0].riderName} rides in{' '}
              {waited[0].ringA} and {waited[0].ringB}, so {waited[0].ringA} waits until they&apos;ve
              had their {data.rules.hardRuleSameHorseMin}-minute break (
              {data.rules.hardRuleDiffHorseMin} with a different horse)
              {waited.length > 1 ? ` — plus ${String(waited.length - 1)} more like it` : ''}. No
              rider is double-booked; move a class if you&apos;d rather the ring didn&apos;t sit
              idle.
            </span>
          </div>
        )}

        <p className="mb-2.5 flex items-center gap-1.5 text-[12.5px] text-[var(--fa-ink-3)] italic">
          <span aria-hidden>⠿</span>
          Drag riders to reorder within a class · click a ride for more options.
        </p>

        <ScheduleGrid data={data} day={day} totalDays={totalDays} hidden={hidden} />

        <div className="mt-6 flex flex-col gap-4">
          <div className="fa-card flex flex-wrap items-center gap-3 px-5 py-3.5">
            <span className="text-[13px] font-semibold text-[var(--fa-ink)]">Awards grouping</span>
            <span className="text-[12.5px] text-[var(--fa-ink-3)]">
              How placings are awarded across divisions
            </span>
            <span className="ml-auto">
              <AwardsGroupingToggle data={data} />
            </span>
          </div>
          <ScheduleClashesCard schedule={schedule} />
          <ScheduleRulesCard data={data} />
          <ScheduleKeyCard />
        </div>
      </div>

      {/* The printed schedule keeps the sheet-per-ring layout. */}
      <div className="hidden print:block">
        {schedule.arenas.map((arena) => (
          <RingSchedule
            key={arena.ring}
            arena={arena}
            data={data}
            filterDay={null}
            totalDays={totalDays}
            flags={flags}
          />
        ))}
      </div>
    </div>
  );
}
