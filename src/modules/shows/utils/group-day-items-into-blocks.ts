import { fmtTime, type ScheduleItem, type ScheduleRide } from '@/modules/shows/schedule-engine';

export interface DayBlock {
  cls: string;
  label: string;
  continues: boolean;
  rides: ScheduleRide[];
}

/**
 * Groups one ring-day's ride/break items into class blocks. A class that a
 * break interrupted appears as two blocks, the second marked `continues` —
 * nothing is atomic below a single ride, so a class genuinely can pause and
 * pick back up.
 */
export function groupDayItemsIntoBlocks(items: ScheduleItem[]): DayBlock[] {
  const blocks: DayBlock[] = [];
  const seen = new Set<string>();
  // Tracked by index rather than a nullable reference: a break resets it to -1,
  // and an index keeps both the null check and the append in one expression.
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
