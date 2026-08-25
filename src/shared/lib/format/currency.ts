const DEFAULT_CURRENCY = 'USD';
const DEFAULT_LOCALE = 'en-US';

export function formatMoney(
  amount: number | string | null | undefined,
  currency: string | null = DEFAULT_CURRENCY,
  locale: string | null = DEFAULT_LOCALE,
): string {
  const value = toNumber(amount);
  return new Intl.NumberFormat(locale ?? DEFAULT_LOCALE, {
    style: 'currency',
    currency: currency ?? DEFAULT_CURRENCY,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatMoneyExact(
  amount: number | string | null | undefined,
  currency: string | null = DEFAULT_CURRENCY,
  locale: string | null = DEFAULT_LOCALE,
): string {
  const value = toNumber(amount);
  return new Intl.NumberFormat(locale ?? DEFAULT_LOCALE, {
    style: 'currency',
    currency: currency ?? DEFAULT_CURRENCY,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function toNumber(amount: number | string | null | undefined): number {
  if (amount === null || amount === undefined || amount === '') return 0;
  const value = typeof amount === 'number' ? amount : Number(amount);
  return Number.isFinite(value) ? value : 0;
}
