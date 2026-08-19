export interface TestMovement {
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

export interface Sheet {
  movements: Record<string, number | null>;
  collectives: Record<string, number | null>;

  errors: number;
  remarks: Record<string, string>;
  finalRemarks: string;
  submitted: boolean;
}

export type Score = number | 'ELIM' | 'SCR';

export function maxPoints(test: TestDefinition): number {
  const movements = test.movements.reduce((sum, m) => sum + 10 * m.coef, 0);
  const collectives = test.collectives.reduce((sum, c) => sum + 10 * c.coef, 0);
  return movements + collectives;
}

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

export function deductionSchedule(test: TestDefinition): DeductionSchedule {
  const name = test.name || '';
  const age = /\b[4-8][\s-]?year[\s-]?old\b/i;
  if (/young horse/i.test(name) || age.test(name)) return 'young-horse';
  if (/\bFEI\b|Prix St|Grand Prix|\bIntermediate\b|\bPSG\b/i.test(name)) return 'fei-senior';
  return 'standard';
}

export type Deduction = 'ELIM' | { mode: 'pts' | 'pct'; amount: number };

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

export function marksEnteredCount(sheet: Sheet, test: TestDefinition): number {
  let count = 0;
  for (const m of test.movements) if (sheet.movements[String(m.num)] != null) count++;
  for (const c of test.collectives) if (sheet.collectives[c.key] != null) count++;
  return count;
}

export function marksComplete(sheet: Sheet, test: TestDefinition): boolean {
  return (
    test.movements.every((m) => sheet.movements[String(m.num)] != null) &&
    test.collectives.every((c) => sheet.collectives[c.key] != null)
  );
}

export function isSheetComplete(sheet: Sheet, test: TestDefinition): boolean {
  return sheet.errors >= 3 || marksComplete(sheet, test);
}

export function averagePct(judgeScores: (Score | null)[]): Score | null {
  if (judgeScores.some((v) => v === 'ELIM')) return 'ELIM';
  if (judgeScores.some((v) => v == null)) return null;

  const values = judgeScores.filter((v): v is number => typeof v === 'number');
  if (values.length === 0) return null;

  return Math.round((values.reduce((sum, v) => sum + v, 0) / values.length) * 1000) / 1000;
}

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

  rank: number;
}

export interface ScoredRide {
  num: string;
  rider: string;
  horse: string;
  finalPct: Score | null;
  ctot: number | null;
}

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

export function scoreLabel(score: Score | null): string {
  if (score == null) return '—';
  if (score === 'SCR') return 'Scratch';
  if (score === 'ELIM') return 'Eliminated';
  return `${score.toFixed(3)}%`;
}

export function clampMark(value: number): number {
  const halved = Math.round(value * 2) / 2;
  return Math.max(0, Math.min(10, halved));
}

export function blankSheet(test: TestDefinition): Sheet {
  const movements: Record<string, number | null> = {};
  const collectives: Record<string, number | null> = {};
  for (const m of test.movements) movements[String(m.num)] = null;
  for (const c of test.collectives) collectives[c.key] = null;
  return { movements, collectives, errors: 0, remarks: {}, finalRemarks: '', submitted: false };
}
