import type { Arena } from '@/modules/shows/schedule-engine';
import type { MasterScheduleData } from '@/modules/shows/data/setup-queries';
import { groupDayItemsIntoBlocks } from '@/modules/shows/utils/group-day-items-into-blocks';
import { ClassBlock } from '@/modules/shows/ui/schedule/class-block';

export function DayItems({
  items,
  data,
  day,
  ring,
  totalDays,
  flags,
  currentEntryId,
}: {
  items: Arena['items'];
  data: MasterScheduleData;
  day: number;
  ring: string;
  totalDays: number;
  flags: Map<string, { count: number; horses: Set<string> }>;
  currentEntryId: string | null;
}) {
  const blocks = groupDayItemsIntoBlocks(items);

  return (
    <>
      {blocks.map((block) =>
        block.rides.length === 0 ? (
          <div
            key={block.cls}
            className="my-2.5 text-center text-[12.5px] font-semibold text-[#7A8781]"
          >
            — {block.label} —
          </div>
        ) : (
          <ClassBlock
            key={`${block.cls}-${String(block.rides[0]?.start ?? 0)}`}
            block={block}
            data={data}
            day={day}
            ring={ring}
            totalDays={totalDays}
            flags={flags}
            currentEntryId={currentEntryId}
          />
        ),
      )}
    </>
  );
}
