/**
 * Dressage scoring, ported from showrunner-scoring.html.
 *
 * Pure and separate from the query layer for the same reason the schedule and
 * awards engines are: these numbers decide who wins, and a rounding difference
 * or a misapplied error deduction is the kind of mistake that is discovered in
 * a protest rather than in a test run.
 */

export interface TestMovement {
  /** Movement number, as printed on the sheet. */
  num: number;
  text: string;
  coef: number;
}

export interface TestCollective {
  key: string;
  label: string;
  coef: number;
}

export interface TestDefinition {
  name: string;
  movements: TestMovement[];
  collectives: TestCollective[];
}

/** One judge's sheet for one ride. Mirrors the `scores` row. */
export interface Sheet {
  /** Movement number → mark, or null while unscored. */
  movements: Record<string, number | null>;
  collectives: Record<string, number | null>;
  /** Errors of course so far. */
  errors: number;
  remarks: Record<string, string>;
  finalRemarks: string;
  submitted: boolean;
}

/** A ride's outcome: a percentage, or one of the two terminal states. */
export type Score = number | 'ELIM' | 'SCR';

/** Total points available — every mark at 10, times its coefficient. */
export function maxPoints(test: TestDefinition): number {
  const movements = test.movements.reduce((sum, m) => sum + 10 * m.coef, 0);
  const collectives = test.collectives.reduce((sum, c) => sum + 10 * c.coef, 0);
  return movements + collectives;
}

/** Points actually earned. Unscored marks contribute nothing. */
export function earned(sheet: Sheet, test: TestDefinition): number {
  let total = 0;
  for (const m of test.movements) {
    const value = sheet.movements[String(m.num)];
    if (value != null) total += value * m.coef;
  }
  for (const c of test.collectives) {
    const value = sheet.collectives[c.key];
    if (value != null) total += value * c.coef;
  }
  return total;
}

export type DeductionSchedule = 'standard' | 'fei-senior' | 'young-horse';

/**
 * Which error-of-course schedule this test runs under.
 *
 * Three real schedules exist, and applying the national one universally — as an
 * earlier build did — under-penalises FEI rides and over-penalises young-horse
 * ones. Matched on the test's own name because that is the only thing the sheet
 * carries; the schedules are set by USEF/FEI rule, not by us.
 */
export function deductionSchedule(test: TestDefinition): DeductionSchedule {
  const name = test.name || '';
  const age = /\b[4-8][\s-]?year[\s-]?old\b/i;
  if (/young horse/i.test(name) || age.test(name)) return 'young-horse';
  if (/\bFEI\b|Prix St|Grand Prix|\bIntermediate\b|\bPSG\b/i.test(name)) return 'fei-senior';
  return 'standard';
}

export type Deduction = 'ELIM' | { mode: 'pts' | 'pct'; amount: number };

/**
 * The CUMULATIVE deduction after `errors` errors of course — not the cost of
 * the latest one alone.
 *
 *  - Standard USEF/USDF: flat POINTS off the raw score before it becomes a
 *    percentage. 1st −2, 2nd −6 total, elimination on the 3rd.
 *  - FEI senior: PERCENTAGE points off the final score. 1st −2%, elimination
 *    on the 2nd — no third-error grace.
 *  - Young horse: percentage too, but gentler. 1st −0.5%, 2nd −1.5% total,
 *    elimination on the 3rd.
 */
export function errorDeduction(errors: number, test: TestDefinition): Deduction {
  const schedule = deductionSchedule(test);

  if (schedule === 'fei-senior') {
    if (errors >= 2) return 'ELIM';
    return { mode: 'pct', amount: errors === 1 ? 2 : 0 };
  }

  if (schedule === 'young-horse') {
    if (errors >= 3) return 'ELIM';
    return { mode: 'pct', amount: errors === 2 ? 1.5 : errors === 1 ? 0.5 : 0 };
  }

  if (errors >= 3) return 'ELIM';
  return { mode: 'pts', amount: errors === 2 ? 6 : errors === 1 ? 2 : 0 };
}

/**
 * One judge's percentage for one ride, to three decimals.
 *
 * Where the deduction lands differs by schedule and is not interchangeable:
 * points come off the raw score BEFORE the division, percentage points come off
 * AFTER it. Subtracting 2 in the wrong place is a different number.
 */
export function sheetPct(sheet: Sheet, test: TestDefinition): Score {
  const deduction = errorDeduction(sheet.errors, test);
  if (deduction === 'ELIM') return 'ELIM';

  const rawPoints = earned(sheet, test);

  if (deduction.mode === 'pct') {
    const rawPct = (rawPoints / maxPoints(test)) * 100;
    return Math.round(Math.max(0, rawPct - deduction.amount) * 1000) / 1000;
  }

  const points = Math.max(0, rawPoints - deduction.amount);
  return Math.round((points / maxPoints(test)) * 100000) / 1000;
}

/** How many of this test's movements + collectives have a value entered — legacy's `countMarks`. */
export function marksEnteredCount(sheet: Sheet, test: TestDefinition): number {
  let count = 0;
  for (const m of test.movements) if (sheet.movements[String(m.num)] != null) count++;
  for (const c of test.collectives) if (sheet.collectives[c.key] != null) count++;
  return count;
}

/** Every mark filled in. */
export function marksComplete(sheet: Sheet, test: TestDefinition): boolean {
  return (
    test.movements.every((m) => sheet.movements[String(m.num)] != null) &&
    test.collectives.every((c) => sheet.collectives[c.key] != null)
  );
}

/** A sheet is finished when it is fully marked — or eliminated, which ends it early. */
export function isSheetComplete(sheet: Sheet, test: TestDefinition): boolean {
  return sheet.errors >= 3 || marksComplete(sheet, test);
}

/**
 * The ride's final percentage: the panel's judges averaged.
 *
 * Null until every seat has scored — a two-judge ride showing one judge's
 * number as "the score" would be wrong by however much the second disagrees.
 * Any single elimination eliminates the ride.
 */
export function averagePct(judgeScores: (Score | null)[]): Score | null {
  if (judgeScores.some((v) => v === 'ELIM')) return 'ELIM';
  if (judgeScores.some((v) => v == null)) return null;

  const values = judgeScores.filter((v): v is number => typeof v === 'number');
  if (values.length === 0) return null;

  return Math.round((values.reduce((sum, v) => sum + v, 0) / values.length) * 1000) / 1000;
}

/**
 * The ride's collective-marks total, averaged across the panel.
 *
 * This is the dressage tie-break: on an equal percentage, the higher collective
 * total ranks ahead (USEF/USDF rule). Null when no seat has scored any
 * collectives yet — which means the tie stands rather than resolving to zero.
 */
export function collectivesTotal(sheets: Sheet[], test: TestDefinition): number | null {
  const totals: number[] = [];

  for (const sheet of sheets) {
    let sum: number | null = null;
    for (const c of test.collectives) {
      const value = sheet.collectives[c.key];
      if (value != null) sum = (sum ?? 0) + value;
    }
    if (sum != null) totals.push(sum);
  }

  if (totals.length === 0) return null;
  return Math.round((totals.reduce((s, v) => s + v, 0) / totals.length) * 1000) / 1000;
}

export interface StandingRow {
  num: string;
  rider: string;
  horse: string;
  pct: number;
  ctot: number | null;
  /** 1-based place. Ties share a place and the next is skipped. */
  rank: number;
}

export interface ScoredRide {
  num: string;
  rider: string;
  horse: string;
  finalPct: Score | null;
  ctot: number | null;
}

/**
 * Live standings for a class.
 *
 * Only rides with a real percentage place: a scratch, an elimination, or a ride
 * still being scored has no standing yet, so the board shows the places decided
 * so far rather than an order invented from the draw.
 *
 * Ties share a place and the next distinct place is skipped — 1st, 1st, 3rd,
 * never a second 2nd.
 */
export function standings(rides: ScoredRide[]): StandingRow[] {
  const scored = rides
    .filter((r): r is ScoredRide & { finalPct: number } => typeof r.finalPct === 'number')
    .map((r) => ({ num: r.num, rider: r.rider, horse: r.horse, pct: r.finalPct, ctot: r.ctot }))
    .sort((a, b) => {
      if (b.pct !== a.pct) return b.pct - a.pct;
      if (a.ctot != null && b.ctot != null && a.ctot !== b.ctot) return b.ctot - a.ctot;
      return 0;
    });

  let rank = 1;
  return scored.map((row, i) => {
    if (i > 0) {
      const prev = scored[i - 1];
      const stillTied =
        row.pct === prev?.pct && (row.ctot == null || prev.ctot == null || row.ctot === prev.ctot);
      if (!stillTied) rank = i + 1;
    }
    return { ...row, rank };
  });
}

/** How a percentage reads on screen. */
export function scoreLabel(score: Score | null): string {
  if (score == null) return '—';
  if (score === 'SCR') return 'Scratch';
  if (score === 'ELIM') return 'Eliminated';
  return `${score.toFixed(3)}%`;
}

/**
 * Marks are half-points, 0 to 10 — the range a dressage judge actually calls.
 * Anything else is clamped rather than rejected, so a fat-fingered 88 becomes
 * 10 instead of failing mid-ride.
 */
export function clampMark(value: number): number {
  const halved = Math.round(value * 2) / 2;
  return Math.max(0, Math.min(10, halved));
}

/** An empty sheet for a test — every mark unscored, no errors. */
export function blankSheet(test: TestDefinition): Sheet {
  const movements: Record<string, number | null> = {};
  const collectives: Record<string, number | null> = {};
  for (const m of test.movements) movements[String(m.num)] = null;
  for (const c of test.collectives) collectives[c.key] = null;
  return { movements, collectives, errors: 0, remarks: {}, finalRemarks: '', submitted: false };
}
