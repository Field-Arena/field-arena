import type { Cell } from '../types';

const clean = (value: string | null | undefined) => (value ?? '').replace(/\s+/g, ' ').trim();

/* USEF wants "Last First" in one field with no comma ("Smith John", never
 * "Smith, John"). Uses first and last when both are on file; otherwise splits
 * a single typed name, treating "Last, First" as already ordered and otherwise
 * taking the final word as the surname. */
export function formatLastFirst(
  firstName: string | null,
  lastName: string | null,
  fallbackName: string | null = null,
): string {
  const first = clean(firstName);
  const last = clean(lastName);
  if (first && last) return `${last} ${first}`;
  if (last) return last;
  if (first) return first;

  const fallback = clean(fallbackName);
  if (!fallback) return '';
  if (fallback.includes(',')) return clean(fallback.replace(/,/g, ' '));
  const words = fallback.split(' ');
  if (words.length === 1) return fallback;
  const surname = words[words.length - 1] ?? '';
  return `${surname} ${words.slice(0, -1).join(' ')}`;
}

/* The class title may not contain quotation marks. */
export function cleanClassTitle(title: string): string {
  return clean(title.replace(/["“”'‘’]/g, ''));
}

/* USEF takes percentages as plain numbers, up to three decimals, no % sign. */
export function roundPct(pct: number): number {
  return Math.round(pct * 1000) / 1000;
}

/* Total marks, to one decimal, from a percentage and the test's maximum. */
export function pointsFromPct(pct: number, maxPoints: number): number {
  return Math.round((pct / 100) * maxPoints * 10) / 10;
}

export function clampLength(value: Cell, maxLength: number | null): Cell {
  if (typeof value !== 'string' || maxLength === null) return value;
  return value.length > maxLength ? value.slice(0, maxLength) : value;
}

/* Codes for rides that did not result in a placing, taken from the USEF
 * template notes: E eliminated, S scratched, DQ disqualified. */
export const PLACING_CODES = {
  eliminated: 'E',
  scratched: 'S',
  disqualified: 'DQ',
} as const;

export function placingFor(entry: {
  status: string | null;
  finalPct: string | null;
  rank: number | null;
  pct: number | null;
}): string {
  if (entry.status === 'scratched' || entry.finalPct === 'SCR') return PLACING_CODES.scratched;
  if (entry.finalPct === 'ELIM') return PLACING_CODES.eliminated;
  if (entry.status === 'disqualified') return PLACING_CODES.disqualified;
  if (entry.rank !== null) return String(entry.rank);
  // Scored but not placed: USEF wants a 0, not a blank.
  if (entry.pct !== null) return '0';
  // Not scored yet: left blank so a half-finished show is obvious.
  return '';
}

/* Dressage Rider Status: Adult Amateur, JR/YR or Open. */
export function riderStatusFor(division: string | null): string {
  switch (division) {
    case 'J':
    case 'Y':
      return 'JR/YR';
    case 'A':
      return 'Adult Amateur';
    case 'O':
      return 'Open';
    default:
      return '';
  }
}
