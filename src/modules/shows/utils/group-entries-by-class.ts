import type { EntryListRow } from '@/modules/shows/data/setup-queries';

/**
 * Groups consecutive entries sharing the same class into one row each —
 * relies on `entries` already being sorted by class (as getShowEntries
 * returns it), so a new group starts only when the class actually changes.
 */
export function groupEntriesByClass(
  entries: EntryListRow[],
): { cls: string; rows: EntryListRow[] }[] {
  const groups: { cls: string; rows: EntryListRow[] }[] = [];
  for (const entry of entries) {
    const last = groups.at(-1);
    if (last?.cls === entry.cls) last.rows.push(entry);
    else groups.push({ cls: entry.cls, rows: [entry] });
  }
  return groups;
}
