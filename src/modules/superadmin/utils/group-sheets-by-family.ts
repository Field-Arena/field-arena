import type { CatalogSheetRow } from '@/modules/superadmin/types';

export interface SheetsByFamilySummary {
  byFamily: Map<string, number>;

  stubs: number;
}

export function groupSheetsByFamily(sheets: CatalogSheetRow[]): SheetsByFamilySummary {
  const byFamily = new Map<string, number>();
  for (const sheet of sheets) {
    const family = sheet.family ?? 'unassigned';
    byFamily.set(family, (byFamily.get(family) ?? 0) + 1);
  }
  // A stub is a sheet whose criteria have never been verified — legacy counted
  // `!source`. Counting `!source_file` instead answers a different question
  // ("has a PDF been attached?") under the same label, and a fully transcribed
  // sheet with no file would wrongly read as a stub.
  const stubs = sheets.filter((s) => !s.source).length;
  return { byFamily, stubs };
}
