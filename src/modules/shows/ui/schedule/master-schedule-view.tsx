'use client';

import { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { FileTextIcon, PrinterIcon } from 'lucide-react';
import { Button } from '@/shared/ui/shadcn/button';
import { cn } from '@/shared/lib/utils';
import type { MasterScheduleData } from '@/modules/shows/data/setup-queries';
import { SM_GHOST_BTN } from '@/modules/shows/ui/show-manager/tokens';
import { AwardsGroupingToggle } from '@/modules/shows/ui/schedule/awards-grouping-toggle';
import { ScheduleKeyCard } from '@/modules/shows/ui/schedule/schedule-key-card';
import { ScheduleRulesCard } from '@/modules/shows/ui/schedule/schedule-rules-card';
import { ScheduleClashesCard } from '@/modules/shows/ui/schedule/schedule-clashes-card';
import { PublishScheduleButton } from '@/modules/shows/ui/schedule/publish-schedule-button';
import { DayButton } from '@/modules/shows/ui/schedule/day-button';
import { RingSchedule } from '@/modules/shows/ui/schedule/ring-schedule';
import { RunningOrderView } from '@/modules/shows/ui/schedule/running-order-view';
import { riderDayFlags } from '@/modules/shows/utils/rider-day-flags';
import { dayDate } from '@/modules/shows/utils/day-date';

type ScheduleView = 'order' | 'edit';
const VIEW_KEY = 'fa-schedule-view';
const VIEW_EVENT = 'fa-schedule-view-change';
let memoryView: ScheduleView = 'order';

function readView(): ScheduleView {
  try {
    const stored = window.localStorage.getItem(VIEW_KEY);
    if (stored === 'edit' || stored === 'order') return stored;
  } catch {
    // Storage blocked: use the in-memory choice.
  }
  return memoryView;
}

function writeView(next: ScheduleView) {
  memoryView = next;
  try {
    window.localStorage.setItem(VIEW_KEY, next);
  } catch {
    // Storage blocked: the in-memory choice still applies for this visit.
  }
  window.dispatchEvent(new Event(VIEW_EVENT));
}

function subscribeView(onChange: () => void) {
  const handler = () => {
    onChange();
  };
  window.addEventListener(VIEW_EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(VIEW_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}

export function MasterScheduleView({ data }: { data: MasterScheduleData }) {
  const { schedule } = data;

  const totalDays = Math.max(1, ...schedule.arenas.flatMap((a) => a.items.map((it) => it.day + 1)));
  const [filterDay, setFilterDay] = useState<number | null>(null);
  // Running order is the everyday view; the ring editor is where rides are
  // reordered, timed, moved and scratched.
  // Opens on whichever view this organizer used last. Read through
  // useSyncExternalStore so the server render (always the running order)
  // and the browser agree, then the stored choice applies.
  const view = useSyncExternalStore(subscribeView, readView, () => 'order' as const);
  const setView = writeView;
  const flags = riderDayFlags(schedule.arenas);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2.5 print:hidden">
        <div
          role="tablist"
          aria-label="Schedule view"
          className="inline-flex rounded-[10px] border-2 border-[#C9D3CE] bg-white p-0.5"
        >
          {(
            [
              ['order', 'Running order'],
              ['edit', '✥ Drag & drop editor'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={view === key}
              onClick={() => {
                setView(key);
              }}
              className={`cursor-pointer rounded-[8px] px-3.5 py-1.5 text-[13.5px] font-bold ${
                view === key ? 'bg-[#1A5B3C] text-white' : 'text-[#16261F]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <Button
          type="button"
          variant="ghost"
          className={cn('h-auto', SM_GHOST_BTN, 'hover:bg-transparent')}
          onClick={() => {
            window.print();
          }}
        >
          <PrinterIcon className="size-4" aria-hidden />
          Print schedule
        </Button>

        {(() => {
          const sheetCount = schedule.arenas
            .flatMap((a) => a.items)
            .filter(
              (it) =>
                it.type === 'ride' &&
                it.status !== 'scratched' &&
                (filterDay == null || it.day === filterDay),
            ).length;
          const dayParam = filterDay == null ? '' : `&day=${String(filterDay)}`;
          return (
            <Link
              href={`/dashboard/score-sheets?show=${data.showId}${dayParam}`}
              prefetch={false}
              target="_blank"
              className="inline-flex h-10 items-center gap-2 rounded-[9px] border-2 border-[#1A5B3C] bg-[#1A5B3C] px-4 text-[14px] font-bold text-white no-underline"
            >
              <FileTextIcon className="size-4" aria-hidden />
              Print all score sheets
              {filterDay == null ? '' : ` for Day ${String(filterDay + 1)}`} ({sheetCount})
            </Link>
          );
        })()}

        <PublishScheduleButton showId={data.showId} published={data.published} />

        <span className="ml-auto flex items-center gap-2 text-[12.5px] text-[#6E7C76]">
          Awards grouping
          <AwardsGroupingToggle data={data} />
        </span>
      </div>

      {view === 'edit' && (
        <div className="print:hidden">
          <ScheduleClashesCard schedule={schedule} />
          <ScheduleRulesCard data={data} />
          <ScheduleKeyCard />
        </div>
      )}

      {totalDays > 1 && (
        <div className="mb-4 flex flex-wrap gap-1.5 print:hidden">
          <DayButton
            active={filterDay == null}
            onClick={() => {
              setFilterDay(null);
            }}
          >
            All
          </DayButton>
          {Array.from({ length: totalDays }, (_, i) => i).map((i) => (
            <DayButton
              key={i}
              active={filterDay === i}
              onClick={() => {
                setFilterDay(i);
              }}
            >
              Day {i + 1} — {dayDate(data.startDate, i)}
            </DayButton>
          ))}
        </div>
      )}

      {/* The dashboard's print rule hides everything except [data-print-report]
          (see dashboard.css), so the schedule body has to opt in to print. */}
      <div data-print-report>
        {view === 'order' ? (
          <RunningOrderView data={data} filterDay={filterDay} />
        ) : (
          schedule.arenas.map((arena) => (
            <RingSchedule
              key={arena.ring}
              arena={arena}
              data={data}
              filterDay={filterDay}
              totalDays={totalDays}
              flags={flags}
            />
          ))
        )}
      </div>
    </div>
  );
}
