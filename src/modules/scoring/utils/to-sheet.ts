import type { Sheet } from '@/modules/scoring/scoring-engine';
import type { ScoreRow } from '@/modules/scoring/types';

/** Strips per-mark authorship down to the plain values scoring-engine.ts's pure functions need. */
export function toSheet(
  row: Pick<ScoreRow, 'movements' | 'collectives' | 'errors' | 'finalRemarks' | 'remarks' | 'submitted'>
): Sheet {
  const movements: Record<string, number | null> = {};
  for (const [num, mark] of Object.entries(row.movements)) movements[num] = mark.value;

  const collectives: Record<string, number | null> = {};
  for (const [key, mark] of Object.entries(row.collectives)) collectives[key] = mark.value;

  return {
    movements,
    collectives,
    errors: row.errors,
    remarks: row.remarks,
    finalRemarks: row.finalRemarks,
    submitted: row.submitted,
  };
}
