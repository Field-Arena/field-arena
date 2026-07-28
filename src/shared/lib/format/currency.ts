/**
 * Money formatting.
 *
 * Ported from FA.fmtMoney in the legacy public/assets/app.js, including its
 * backward-compatible bare-dollar path — but the fallback is narrowed. The
 * legacy signature was fmtMoney(n, currency?, locale?) and, with no currency,
 * hardcoded a '$' prefix for "legacy callers". Every organization row now
 * carries a real currency and locale, so that path exists only for values not
 * attached to an organization, and it defaults to USD explicitly rather than
 * pretending currency is unknown.
 *
 * maximumFractionDigits: 0 matches the legacy behaviour — organizer-facing
 * totals are shown as whole units. Use formatMoneyExact where cents matter,
 * such as an invoice line or a refund amount.
 */
const DEFAULT_CURRENCY = 'USD';
const DEFAULT_LOCALE = 'en-US';

export function formatMoney(
  amount: number | string | null | undefined,
  currency: string | null = DEFAULT_CURRENCY,
  locale: string | null = DEFAULT_LOCALE
): string {
  const value = toNumber(amount);
  return new Intl.NumberFormat(locale ?? DEFAULT_LOCALE, {
    style: 'currency',
    currency: currency ?? DEFAULT_CURRENCY,
    maximumFractionDigits: 0,
  }).format(value);
}

/** Same, but keeps cents. For invoices, refunds and anything reconciled against Stripe. */
export function formatMoneyExact(
  amount: number | string | null | undefined,
  currency: string | null = DEFAULT_CURRENCY,
  locale: string | null = DEFAULT_LOCALE
): string {
  const value = toNumber(amount);
  return new Intl.NumberFormat(locale ?? DEFAULT_LOCALE, {
    style: 'currency',
    currency: currency ?? DEFAULT_CURRENCY,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Postgres numeric columns arrive as strings through PostgREST, because a
 * numeric can exceed what an IEEE double represents exactly. Every money value
 * read from the database therefore needs coercing, and a silent NaN here would
 * render as "$NaN" on a billing screen.
 */
function toNumber(amount: number | string | null | undefined): number {
  if (amount === null || amount === undefined || amount === '') return 0;
  const value = typeof amount === 'number' ? amount : Number(amount);
  return Number.isFinite(value) ? value : 0;
}
