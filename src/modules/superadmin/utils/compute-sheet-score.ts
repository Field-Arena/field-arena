import type { SheetDefShape } from '@/modules/superadmin/utils/read-sheet-def';

export interface SheetScore {
  subtotal: number;
  total: number;
  percent: number;
  eligible: boolean;
}

/** USEF DR123 rounding: 3 decimal places, round half up. Defined once, reused. */
export function roundHalfUp(x: number, dp: number): number {
  const f = Math.pow(10, dp);
  return Math.round((x + Number.EPSILON) * f) / f;
}

/** Championship-eligibility floor the judge preview flags against. */
export const ELIGIBILITY_THRESHOLD = 55;

/* Pure scoring math for the movement family — no DOM, unit-testable.
 * Straight port of superadmin.html's computeScore(): every movement and
 * collective mark is multiplied by its coefficient, errors are subtracted from
 * the subtotal, and the percentage is that total over the sheet's maximum,
 * rounded half-up to three places. */
export function computeSheetScore(
  def: Pick<SheetDefShape, 'movements' | 'collectives' | 'maxPoints'>,
  movementMarks: Record<number, string>,
  collectiveMarks: Record<number, string>,
  errors: string,
): SheetScore {
  let subtotal = 0;
  def.movements.forEach((m, i) => {
    const v = parseFloat(movementMarks[i] ?? '');
    if (!Number.isNaN(v)) subtotal += v * (m.coef || 1);
  });
  def.collectives.forEach((c, i) => {
    const v = parseFloat(collectiveMarks[i] ?? '');
    if (!Number.isNaN(v)) subtotal += v * (c.coef || 1);
  });

  const err = parseFloat(errors) || 0;
  const total = subtotal - err;
  const max = parseFloat(def.maxPoints) || 0;
  const percent = max > 0 ? roundHalfUp((total / max) * 100, 3) : 0;

  return { subtotal, total, percent, eligible: percent >= ELIGIBILITY_THRESHOLD };
}

/** Max attainable points if every mark were a 10 — used when maxPoints is blank. */
export function maxPointsForDef(def: Pick<SheetDefShape, 'movements' | 'collectives'>): number {
  const movements = def.movements.reduce((sum, m) => sum + 10 * (m.coef || 1), 0);
  const collectives = def.collectives.reduce((sum, c) => sum + 10 * (c.coef || 1), 0);
  return movements + collectives;
}
