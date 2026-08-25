import type { EntryListRow } from '@/modules/shows/data/setup-queries';

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
