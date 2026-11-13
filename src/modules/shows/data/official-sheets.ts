import 'server-only';
import type { createServerClient } from '@/shared/lib/supabase/server';
import { officialSheetFor } from '@/modules/shows/test-catalog';
import { hasSheetContent } from '@/modules/shows/utils/has-sheet-content';

type SupabaseClient = Awaited<ReturnType<typeof createServerClient>>;

/* Legacy saved each official test's catalog id on the class (catalogId) and
 * scored straight from that sheet, so official tests never needed Test
 * Builder. This resolves the same link: offered test name → its official
 * sheet's source_file (test-catalog.ts) → the scoring_catalog row id, read
 * here on the server rather than trusted from the client. A test only links
 * when exactly one sheet carries that source_file and it has something to
 * score; anything else (custom, independent, TOC, a stub) stays unlinked.
 * Returns test name → scoring_catalog id. */
export async function resolveOfficialSheetIds(
  supabase: SupabaseClient,
  group: string | null,
  tests: readonly string[],
): Promise<Map<string, string>> {
  const sheetByTest = new Map<string, string>();
  for (const test of tests) {
    const sheet = officialSheetFor(group, test);
    if (sheet) sheetByTest.set(test, sheet);
  }
  const ids = new Map<string, string>();
  if (sheetByTest.size === 0) return ids;

  const { data, error } = await supabase
    .from('scoring_catalog')
    .select('id, source_file, def')
    .in('source_file', [...new Set(sheetByTest.values())]);
  if (error) throw new Error(error.message);

  const rowsBySheet = new Map<string, typeof data>();
  for (const row of data) {
    if (!row.source_file) continue;
    rowsBySheet.set(row.source_file, [...(rowsBySheet.get(row.source_file) ?? []), row]);
  }
  for (const [test, sheet] of sheetByTest) {
    const rows = rowsBySheet.get(sheet) ?? [];
    const only = rows.length === 1 ? rows[0] : undefined;
    if (only && hasSheetContent(only.def)) ids.set(test, only.id);
  }
  return ids;
}
