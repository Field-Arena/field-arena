export function parseMoneyField(value: string): number | null {
  const n = Number(value.replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) && value.trim() ? n : null;
}
