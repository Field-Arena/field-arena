import type { CatalogSheetRow, TestSheetItem } from '@/modules/superadmin/types';

/* One row per catalog sheet — the checklist's whole point is "uploaded vs
 * still missing" across the known, finite set of official tests. Dropping
 * sheets that have no source_file yet hid them from the list AND from its
 * denominator, so a sheet with no filename could never be noticed, let alone
 * given a file. Sheets without one fall back to a canonical name derived from
 * the title, which is exactly what an upload against them is stored under. */
export function toTestSheetItems(sheets: CatalogSheetRow[]): TestSheetItem[] {
  return sheets.map((s) => ({
    id: s.id,
    title: s.title,
    level: s.level,
    sourceFile: s.source_file ?? `${s.title.replace(/[^a-zA-Z0-9]+/g, '_')}.pdf`,
    hasDeclaredSourceFile: Boolean(s.source_file),
  }));
}
