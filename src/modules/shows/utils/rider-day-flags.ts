import type { Arena } from '@/modules/shows/schedule-engine';

export function riderDayFlags(
  arenas: Arena[],
): Map<string, { count: number; horses: Set<string> }> {
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
