import { MARK_MAX, MARK_MIN, MARK_STEP } from '@/modules/scoring/constants';

/** A mark typed in from a paper sheet: "6", "6.5" or "6,5". Empty → null
 * (not entered yet); anything that isn't a 0–10 mark in half points →
 * 'invalid'. */
export function parsePaperMark(raw: string): number | null | 'invalid' {
  const text = raw.trim().replace(',', '.');
  if (text === '') return null;
  if (!/^\d{1,2}(\.\d)?$/.test(text)) return 'invalid';
  const value = Number(text);
  if (value < MARK_MIN || value > MARK_MAX) return 'invalid';
  if (Math.round(value / MARK_STEP) * MARK_STEP !== value) return 'invalid';
  return value;
}
