import type { CatalogSheetRow, TestSheetItem } from '@/modules/superadmin/types';

/**
 * Narrows the catalog to sheets with an official source file and reshapes them
 * for the Documents board's Tests tab, which matches uploads to sheets by name.
 */
export function toTestSheetItems(sheets: CatalogSheetRow[]): TestSheetItem[] {
  return sheets
    .filter((s) => s.source_file)
    .map((s) => ({ id: s.id, title: s.title, level: s.level, sourceFile: s.source_file ?? '' }));
}
