import {
  averagePct,
  collectivesTotal,
  sheetPct,
  type Sheet,
  type TestDefinition,
} from '@/modules/scoring/scoring-engine';

export interface RideResult {
  /** Average of the judges' percentages, 'ELIM', or null when a sheet can't be scored. */
  finalPct: string | null;
  /** Each judge seat's percentage, keyed by seat id. */
  judgePct: Record<string, string>;
  collectiveTotal: number | null;
}

/** A ride's result from its judges' signed sheets — the numbers written to
 * class_entries when a ride is finished, whether it was scored live
 * (advanceRide) or typed in from paper (savePaperSheet). */
export function computeRideResult(
  seatSheets: readonly { seatId: string; sheet: Sheet }[],
  test: TestDefinition | null,
): RideResult {
  const judgePct: Record<string, string> = {};
  const pcts = seatSheets.map(({ seatId, sheet }) => {
    const pct = test ? sheetPct(sheet, test) : null;
    if (pct !== null) judgePct[seatId] = String(pct);
    return pct;
  });

  const finalPct = averagePct(
    pcts.map((pct) => (typeof pct === 'number' || pct === 'ELIM' ? pct : null)),
  );

  return {
    finalPct: finalPct === null ? null : String(finalPct),
    judgePct,
    collectiveTotal: test
      ? collectivesTotal(
          seatSheets.map((s) => s.sheet),
          test,
        )
      : null,
  };
}
