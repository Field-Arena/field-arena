/**
 * Platform fee formulas, ported from api/_lib/fees.js.
 *
 * The legacy codebase had two copies of this on purpose: the canonical
 * server-side one, and a client mirror used only to update an on-screen fee
 * preview while someone types a price. That split is preserved here, but the
 * duplication is not — this module is imported by both the Server Action that
 * charges and the form that previews, so they cannot drift.
 *
 * The rule that matters: the amount actually charged is always recomputed
 * server-side inside the Server Action. A fee arriving in a request body is a
 * display value and is never trusted, because a client that can compute money
 * math can also lie about it.
 *
 * Note these return unrounded values, matching the legacy functions. Rounding
 * belongs at the point of charge, in the smallest currency unit Stripe expects,
 * not part-way through a fee calculation where it would compound.
 */

/**
 * Class entry fees.
 *
 * - 'default' (or unset): a $7.99 floor, otherwise 8%.
 * - 'gmo': a flat 18% with no floor. USDF Group Member Organizations are
 *   smaller club-run shows that accept a higher flat rate on entries in
 *   exchange for no per-organization platform fee elsewhere.
 *
 * Applies to class entries only. Everything else uses the flat 8% below.
 */
export function calcPlatformFee(price: number | string, feeModel?: string | null): number {
  const value = toPrice(price);
  if (feeModel === 'gmo') return value * 0.18;
  if (value <= 75) return 7.99;
  return Math.max(7.99, value * 0.08);
}

/**
 * Vendor booths, rider add-ons and qualification fees: a flat 8% of the item's
 * own price. No floor, and deliberately unaffected by the GMO fee model.
 *
 * Kept as a separate function rather than a flag on calcPlatformFee so every
 * call site has to state which rule applies to what it is pricing — a boolean
 * argument would make the wrong choice invisible at the call site.
 */
export function calcPlatformFeeFlat8(price: number | string): number {
  return toPrice(price) * 0.08;
}

function toPrice(price: number | string): number {
  const value = typeof price === 'number' ? price : Number.parseFloat(price);
  return Number.isFinite(value) && value > 0 ? value : 0;
}
