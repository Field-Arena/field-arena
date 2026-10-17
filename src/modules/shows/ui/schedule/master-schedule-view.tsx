'use client';

import { useState, useSyncExternalStore, type ReactNode } from 'react';
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
type RulesShown = 'shown' | 'hidden';
const CHOICE_EVENT = 'fa-schedule-choice-change';

/* A per-browser remembered choice (which view, whether the rules show).
 * Read through useSyncExternalStore so the server render uses the fallback
 * and the browser then applies the stored value. */
function storedChoice<T extends string>(key: string, values: readonly T[], fallback: T) {
  let memory = fallback;
  return {
    read: (): T => {
      try {
        const stored = window.localStorage.getItem(key);
        const match = values.find((v) => v === stored);
        if (match) return match;
      } catch {
        // Storage blocked: use the in-memory choice.
      }
      return memory;
    },
    write: (next: T) => {
      memory = next;
      try {
        window.localStorage.setItem(key, next);
      } catch {
        // Storage blocked: the in-memory choice still applies for this visit.
      }
      window.dispatchEvent(new Event(CHOICE_EVENT));
    },
    fallback: () => fallback,
  };
}

function subscribeChoice(onChange: () => void) {
  const handler = () => {
    onChange();
  };
  window.addEventListener(CHOICE_EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(CHOICE_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}

const viewChoice = storedChoice<ScheduleView>('fa-schedule-view', ['order', 'edit'], 'order');
const rulesChoice = storedChoice<RulesShown>('fa-schedule-rules', ['shown', 'hidden'], 'hidden');

export function MasterScheduleView({
  data,
  preferences,
}: {
  data: MasterScheduleData;
  /** Pacing/order/day-time preferences, shown with the rules. */
  preferences?: ReactNode;
}) {
  const { schedule } = data;

  const totalDays = Math.max(1, ...schedule.arenas.flatMap((a) => a.items.map((it) => it.day + 1)));
  const [filterDay, setFilterDay] = useState<number | null>(null);
  // Running order is the everyday view; the ring editor is where rides are
  // reordered, timed, moved and scratched.
  // Opens on whichever view this organizer used last. Read through
  // useSyncExternalStore so the server render (always the running order)
  // and the browser agree, then the stored choice applies.
  const view = useSyncExternalStore(subscribeChoice, viewChoice.read, viewChoice.fallback);
  const setView = viewChoice.write;
  const rules = useSyncExternalStore(subscribeChoice, rulesChoice.read, rulesChoice.fallback);
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

        <button
          type="button"
          aria-expanded={rules === 'shown'}
          aria-controls="schedule-rules"
          onClick={() => {
            rulesChoice.write(rules === 'shown' ? 'hidden' : 'shown');
          }}
          className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-[9px] border-2 border-[#1A5B3C] bg-white px-3.5 text-[13.5px] font-bold text-[#1A5B3C] hover:bg-[#E9F4EE]"
        >
          Schedule rules {rules === 'shown' ? '▴ Hide' : '▾ Show'}
        </button>

        <span className="ml-auto flex items-center gap-2 text-[12.5px] text-[#6E7C76]">
          Awards grouping
          <AwardsGroupingToggle data={data} />
        </span>
      </div>

      <div className="print:hidden">
        {view === 'edit' && <ScheduleClashesCard schedule={schedule} />}
        {rules === 'shown' && (
          <div id="schedule-rules">
            {preferences}
            <ScheduleRulesCard data={data} />
            {view === 'edit' && <ScheduleKeyCard />}
          </div>
        )}
      </div>

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
