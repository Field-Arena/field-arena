/* The one placing rule for every results surface (judge placings, awards,
 * show results export, announcer board, operations results).
 *
 * - Unscored rows (pct null) are left out.
 * - Rows are grouped by test: a Test of Choice class puts riders on different
 *   tests, and a percentage only compares against others on the same test.
 *   A null/undefined testName is the class's default test.
 * - Within a group: pct descending, then collectives total descending, with a
 *   missing collectives total ranked after any real one.
 * - Equal pct and equal collectives (both missing counts as equal) share a
 *   placing: 1, 1, 3.
 * - Ranks are 1-based. Groups come back ordered by test name. */
export interface RankableRow {
  pct: number | null;
  ctot: number | null;
  testName?: string | null;
}

export type Ranked<T> = T & { rank: number };

function compareRows(a: RankableRow & { pct: number }, b: RankableRow & { pct: number }): number {
  if (b.pct !== a.pct) return b.pct - a.pct;
  if (a.ctot == null && b.ctot == null) return 0;
  if (a.ctot == null) return 1;
  if (b.ctot == null) return -1;
  return b.ctot - a.ctot;
}

export function rankPlacings<T extends RankableRow>(rows: readonly T[]): Ranked<T>[] {
  const groups = new Map<string, (T & { pct: number })[]>();
  for (const row of rows) {
    if (typeof row.pct !== 'number' || !Number.isFinite(row.pct)) continue;
    const key = row.testName ?? '';
    const group = groups.get(key) ?? [];
    group.push(row as T & { pct: number });
    groups.set(key, group);
  }

  const orderedKeys = [...groups.keys()].sort((a, b) => a.localeCompare(b));
  return orderedKeys.flatMap((key) => {
    const sorted = [...(groups.get(key) ?? [])].sort(compareRows);
    let rank = 1;
    return sorted.map((row, i) => {
      const prev = sorted[i - 1];
      if (prev && compareRows(prev, row) !== 0) rank = i + 1;
      return { ...row, rank };
    });
  });
}

/** The test a rider rode when it differs from the class test (class_entries.test_override.name). */
export function overrideTestName(override: unknown): string | null {
  if (!override || typeof override !== 'object') return null;
  const name = (override as Record<string, unknown>).name;
  return typeof name === 'string' && name.trim() ? name : null;
}
