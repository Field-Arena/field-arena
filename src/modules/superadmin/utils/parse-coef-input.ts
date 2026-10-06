import { sanitizeDecimalInput } from '@/shared/lib/format/number-input';

/**
 * Typed coefficient / weight → a number the sheet schema accepts: junk
 * characters are dropped, blank becomes 0, and the value is capped at `max`
 * (the schema's own upper bound) so an out-of-range number never reaches save.
 */
export function parseCoefInput(value: string, max: number): number {
  const n = Number(sanitizeDecimalInput(value, { decimals: 2, maxIntegerDigits: 3 }));
  if (!Number.isFinite(n)) return 0;
  return Math.min(n, max);
}
