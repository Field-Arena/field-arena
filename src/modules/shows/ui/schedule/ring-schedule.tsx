import { fmtTime, type Arena, type ScheduleRide } from '@/modules/shows/schedule-engine';
import type { MasterScheduleData } from '@/modules/shows/types';
import { RING_SIZE_LABEL } from '@/modules/shows/constants';
import { dayDate } from '@/modules/shows/utils/day-date';
import { DayItems } from '@/modules/shows/ui/schedule/day-items';

export function RingSchedule({
  arena,
  data,
  filterDay,
  totalDays,
  flags,
}: {
  arena: Arena;
  data: MasterScheduleData;
  filterDay: number | null;
  totalDays: number;
  flags: Map<string, { count: number; horses: Set<string> }>;
}) {
  const days = [...new Set(arena.items.map((it) => it.day))].sort((a, b) => a - b);

  const rides = arena.items.filter((it): it is ScheduleRide => it.type === 'ride');
  const currentEntryId = rides.find((r) => !data.finalPctByEntry[r.entryId])?.entryId ?? null;

  return (
    <>
      {days.map((day) => {
        if (filterDay != null && day !== filterDay) return null;
        const items = arena.items.filter((it) => it.day === day);
        if (items.length === 0) return null;

        const lastEnd = items[items.length - 1]?.end ?? 0;

        return (
          <section
            key={`${arena.ring}-${String(day)}`}
            className="mb-6 rounded-[12px] border border-[#E7EAEE] bg-white p-5 print:break-after-page"
          >
            <header className="mb-3 border-b border-[#E7EAEE] pb-2.5">
              <h2 className="font-[family-name:var(--font-nr)] text-[19px] font-semibold text-[#101828]">
                {data.showName}
              </h2>
              <div className="text-[12.5px] text-[#8A94A3]">
                Schedule of Classes
                {data.timezone && (
                  <span className="font-normal"> — times shown in {data.timezone}</span>
                )}
              </div>
              <div className="mt-0.5 text-[12.5px] font-semibold text-[#101828]">
                {days.length > 1
                  ? `Day ${String(day + 1)} of ${String(days.length)} — ${dayDate(data.startDate, day)}`
                  : dayDate(data.startDate, day)}
              </div>
            </header>

            <div className="mb-3 text-[14px] font-bold text-[#101828]">
              {arena.ring}{' '}
              <span className="text-[12.5px] font-normal text-[#8A94A3]">
                — {RING_SIZE_LABEL[arena.ringSize] ?? RING_SIZE_LABEL.standard}
              </span>
            </div>

            <DayItems
              items={items}
              data={data}
              day={day}
              ring={arena.ring}
              totalDays={totalDays}
              flags={flags}
              currentEntryId={currentEntryId}
            />

            <div className="mt-3 text-center text-[12.5px] font-semibold text-[#8A94A3]">
              — Arena Done {fmtTime(lastEnd)} —
            </div>
          </section>
        );
      })}
    </>
  );
}
