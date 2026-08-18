import type { CatalogSheetRow } from '@/modules/superadmin/types';

export interface SheetsByFamilySummary {
  byFamily: Map<string, number>;
  /** Sheets with no source PDF attached yet. */
  stubs: number;
}

/** Groups the catalog by scoring family for the platform-library stat tiles. */
export function groupSheetsByFamily(sheets: CatalogSheetRow[]): SheetsByFamilySummary {
  const byFamily = new Map<string, number>();
  for (const sheet of sheets) {
    const family = sheet.family ?? 'unassigned';
    byFamily.set(family, (byFamily.get(family) ?? 0) + 1);
  }
  const stubs = sheets.filter((s) => !s.source_file).length;
  return { byFamily, stubs };
}
