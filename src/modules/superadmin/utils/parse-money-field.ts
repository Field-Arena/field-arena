/** Reads a numeric field back to a plain number, or null if blank/garbage. */
export function parseMoneyField(value: string): number | null {
  const n = Number(value.replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) && value.trim() ? n : null;
}
