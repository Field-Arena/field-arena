import type { CatalogSheetRow, TestSheetItem } from '@/modules/superadmin/types';

export function toTestSheetItems(sheets: CatalogSheetRow[]): TestSheetItem[] {
  return sheets
    .filter((s) => s.source_file)
    .map((s) => ({ id: s.id, title: s.title, level: s.level, sourceFile: s.source_file ?? '' }));
}
