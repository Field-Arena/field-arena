import { rankPlacings } from '@/shared/lib/rank-placings';

/* Adapter over the shared placing rule (shared/lib/rank-placings): per test,
 * pct then collectives, shared 1-based places. Unscored rows are dropped. */
export function withSharedRank<
  T extends { finalPctNum: number | null; ctot?: number | null; testName?: string | null },
>(rows: T[]): (T & { place: number })[] {
  const ranked = rankPlacings(
    rows.map((row) => ({
      row,
      pct: row.finalPctNum,
      ctot: row.ctot ?? null,
      testName: row.testName ?? null,
    })),
  );
  return ranked.map(({ row, rank }) => ({ ...row, place: rank }));
}
