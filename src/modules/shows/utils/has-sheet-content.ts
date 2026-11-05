// The arrays a scoring_catalog def can carry, across every sheet family:
// movement/collective marks, freestyle technical/artistic, weighted criteria
// and placing categories (see the SuperAdmin sheet editors).
const SHEET_CONTENT_KEYS = [
  'movements',
  'collectives',
  'technical',
  'artistic',
  'criteria',
  'categories',
] as const;

/** Whether a catalog sheet's def has anything to score. Stubs ('{}', or an
 * unassigned sheet nobody filled in) don't count as a test. */
export function hasSheetContent(def: unknown): boolean {
  if (!def || typeof def !== 'object' || Array.isArray(def)) return false;
  const record = def as Record<string, unknown>;
  return SHEET_CONTENT_KEYS.some((key) => {
    const value = record[key];
    return Array.isArray(value) && value.length > 0;
  });
}
