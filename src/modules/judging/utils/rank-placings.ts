import { rankPlacings as rankSharedPlacings } from '@/shared/lib/rank-placings';

export interface PlacingRow {
  entryId: string;
  num: string;
  rider: string;
  horse: string;
  pct: number;
  rank: number;
  testName: string | null;
}

interface Ride {
  entryId: string;
  num: string;
  rider: string;
  horse: string;
  finalPct: number | null;
  ctot: number | null;
  testName: string | null;
}

/* Judge placings — ranked by the shared rule in shared/lib/rank-placings
 * (per test, pct then collectives, shared 1-based placings). Rows come back
 * grouped by test; callers group by `testName` for section headings. */
export function rankPlacings(rides: Ride[]): PlacingRow[] {
  return rankSharedPlacings(rides.map((r) => ({ ...r, pct: r.finalPct }))).map((r) => ({
    entryId: r.entryId,
    num: r.num,
    rider: r.rider,
    horse: r.horse,
    pct: r.pct ?? 0, // never null: unscored rides are dropped by the ranker
    rank: r.rank,
    testName: r.testName,
  }));
}
