export function calcPlatformFee(price: number | string, feeModel?: string | null): number {
  const value = toPrice(price);
  if (feeModel === 'gmo') return value * 0.18;
  if (value <= 75) return 7.99;
  return Math.max(7.99, value * 0.08);
}

export function calcPlatformFeeFlat8(price: number | string): number {
  return toPrice(price) * 0.08;
}

function toPrice(price: number | string): number {
  const value = typeof price === 'number' ? price : Number.parseFloat(price);
  return Number.isFinite(value) && value > 0 ? value : 0;
}
