import type { Arena } from '@/modules/shows/schedule-engine';

/**
 * Which riders are doing more than one thing on a given day.
 *
 * Two separate facts, because they mean different things to whoever runs the
 * day: riding several events, and riding more than one horse. The legacy view
 * marks each with its own colour, and both together with both.
 */
export function riderDayFlags(arenas: Arena[]): Map<string, { count: number; horses: Set<string> }> {
  const flags = new Map<string, { count: number; horses: Set<string> }>();

  for (const arena of arenas) {
    for (const item of arena.items) {
      if (item.type !== 'ride') continue;
      const key = `${item.num}|${String(item.day)}`;
      const current = flags.get(key) ?? { count: 0, horses: new Set<string>() };
      current.count += 1;
      if (item.horse) current.horses.add(item.horse);
      flags.set(key, current);
    }
  }

  return flags;
}
