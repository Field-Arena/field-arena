export interface PlacingRow {
  entryId: string;
  num: string;
  rider: string;
  horse: string;
  pct: number;
  rank: number;
}

export function rankPlacings(
  rides: {
    entryId: string;
    num: string;
    rider: string;
    horse: string;
    finalPct: number | null;
    ctot: number | null;
  }[],
): PlacingRow[] {
  const scored = rides
    .filter((r): r is typeof r & { finalPct: number } => typeof r.finalPct === 'number')
    .sort((a, b) => {
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
    };
  });
}
