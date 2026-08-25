'use client';

import { useState } from 'react';
import { PrinterIcon } from 'lucide-react';
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
import { riderDayFlags } from '@/modules/shows/utils/rider-day-flags';
import { dayDate } from '@/modules/shows/utils/day-date';

export function MasterScheduleView({ data }: { data: MasterScheduleData }) {
  const { schedule } = data;

  const totalDays = Math.max(1, ...schedule.arenas.flatMap((a) => a.items.map((it) => it.day + 1)));
  const [filterDay, setFilterDay] = useState<number | null>(null);
  const flags = riderDayFlags(schedule.arenas);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2.5 print:hidden">
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

        <PublishScheduleButton showId={data.showId} published={data.published} />

        <span className="ml-auto flex items-center gap-2 text-[12.5px] text-[#6E7C76]">
          Awards grouping
          <AwardsGroupingToggle data={data} />
        </span>
      </div>

      <div className="print:hidden">
        <ScheduleClashesCard schedule={schedule} />
        <ScheduleRulesCard data={data} />
        <ScheduleKeyCard />
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

      {schedule.arenas.map((arena) => (
        <RingSchedule
          key={arena.ring}
          arena={arena}
          data={data}
          filterDay={filterDay}
          totalDays={totalDays}
          flags={flags}
        />
      ))}
    </div>
  );
}
