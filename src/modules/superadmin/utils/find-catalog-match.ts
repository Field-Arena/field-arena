import { normalizeFilename } from '@/modules/superadmin/utils/normalize-filename';

export interface MatchableSheet {
  id: string;
  title: string;
  sourceFile: string;
}

/* Shared matcher for bulk upload and for re-matching already-uploaded files.
 * Three tiers, in order (legacy findCatalogMatch):
 *   1. exact normalized TITLE match
 *   2. exact normalized sourceFile match — catches stubs like
 *      'Quad_Third_Level_Test' that the real file "Quadrille Third Level
 *      Test.pdf" should hit even though the catalog title differs
 *   3. substring fallback, either normalized string contained in the other,
 *      for real filenames carrying extra descriptive words a strict match
 *      can't handle (e.g. "Scoresheets 1Star - Ind_ two judges_updated
 *      14.02.pdf"). The >= 6 guard stops a short title (or short filename)
 *      from spuriously matching almost anything; the longest candidate wins.
 */
export function findCatalogMatch<T extends MatchableSheet>(
  filename: string,
  sheets: T[],
): T | null {
  const norm = normalizeFilename(filename);
  if (!norm) return null;

  const byTitle = sheets.find((c) => normalizeFilename(c.title) === norm);
  if (byTitle) return byTitle;

  const bySource = sheets.find((c) => c.sourceFile && normalizeFilename(c.sourceFile) === norm);
  if (bySource) return bySource;

  const candidates = sheets.filter((c) => {
    const ct = normalizeFilename(c.title);
    if (ct.length < 6 || norm.length < 6) return false;
    return norm.includes(ct) || ct.includes(norm);
  });
  if (candidates.length === 0) return null;

  return (
    [...candidates].sort(
      (a, b) => normalizeFilename(b.title).length - normalizeFilename(a.title).length,
    )[0] ?? null
  );
}
