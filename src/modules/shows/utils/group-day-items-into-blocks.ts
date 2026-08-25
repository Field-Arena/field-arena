import { fmtTime, type ScheduleItem, type ScheduleRide } from '@/modules/shows/schedule-engine';

export interface DayBlock {
  cls: string;
  label: string;
  continues: boolean;
  rides: ScheduleRide[];
}

export function groupDayItemsIntoBlocks(items: ScheduleItem[]): DayBlock[] {
  const blocks: DayBlock[] = [];
  const seen = new Set<string>();

  let openIndex = -1;

  for (const item of items) {
    if (item.type !== 'ride') {
      openIndex = -1;
      blocks.push({
        cls: `break-${String(item.start)}`,
        label: `${item.label} ${fmtTime(item.start)} to ${fmtTime(item.end)}`,
        continues: false,
        rides: [],
      });
      continue;
    }

    if (blocks[openIndex]?.cls !== item.cls) {
      blocks.push({
        cls: item.cls,
        label: item.label,
        continues: seen.has(item.cls),
        rides: [],
      });
      seen.add(item.cls);
      openIndex = blocks.length - 1;
    }
    blocks[openIndex]?.rides.push(item);
  }

  return blocks;
}
