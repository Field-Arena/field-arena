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

/* Ranks within one already-filtered, single-test group of rides — the
 * original whole-class algorithm, unchanged. */
function rankGroup(rides: (Ride & { finalPct: number })[]): PlacingRow[] {
  const scored = [...rides].sort((a, b) => {
    if (b.finalPct !== a.finalPct) return b.finalPct - a.finalPct;
    if (a.ctot != null && b.ctot != null && a.ctot !== b.ctot) return b.ctot - a.ctot;
    return 0;
  });

  let rank = 1;
  return scored.map((row, i) => {
    if (i > 0) {
      const prev = scored[i - 1];
      const stillTied =
        row.finalPct === prev?.finalPct &&
        (row.ctot == null || prev.ctot == null || row.ctot === prev.ctot);
      if (!stillTied) rank = i + 1;
    }
    return {
      entryId: row.entryId,
      num: row.num,
      rider: row.rider,
      horse: row.horse,
      pct: row.finalPct,
      rank,
      testName: row.testName,
    };
  });
}

/* A Test of Choice class has riders on different tests within the same
 * class — a 68% on Training Level Test 1 and a 68% on First Level Test 3
 * aren't the same result, so they can't share one ranked pool. Group by
 * testName first (null = the class's single default test, unchanged
 * behaviour for every ordinary class) and rank each group independently;
 * rows come back concatenated, grouped by test, each with its own 1..N
 * ranks. Callers that want a section heading per test can group `rows` by
 * `testName` themselves — nothing here assumes a particular render shape. */
export function rankPlacings(rides: Ride[]): PlacingRow[] {
  const scored = rides.filter(
    (r): r is Ride & { finalPct: number } => typeof r.finalPct === 'number',
  );

  const groups = new Map<string, (Ride & { finalPct: number })[]>();
  for (const ride of scored) {
    const key = ride.testName ?? '';
    const group = groups.get(key) ?? [];
    group.push(ride);
    groups.set(key, group);
  }

  const orderedKeys = [...groups.keys()].sort((a, b) => a.localeCompare(b));
  return orderedKeys.flatMap((key) => rankGroup(groups.get(key) ?? []));
}
