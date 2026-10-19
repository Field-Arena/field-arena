/* One definition of "money this show actually kept", used by every screen that
 * reports revenue.
 *
 * Two screens computing this independently is how Event Sales and the P&L came
 * to disagree: Event Sales derived a refunded/partial status and dropped those
 * sales, while the P&L read the raw `status` column — which a refund never
 * changes (refundSale only increments refunded_amount) — and so counted fully
 * refunded money as revenue.
 *
 * Legacy had the mirror-image flaw: smRevenueTotal excluded a refunded sale
 * ENTIRELY rather than netting it, so a $5 refund on a $500 sale erased all
 * $500 from revenue. Neither behaviour is right, so this nets properly rather
 * than copying either:
 *
 *   collected = amount_total + additional_charges_total
 *             − refunded_amount − (refunds on additional charges)
 *
 * additional_charges_total is separate from amount_total (chargeMore creates a
 * new PaymentIntent and never rewrites the original), so it has to be added,
 * not assumed included. Likewise refunded_amount only ever tracks the ORIGINAL
 * payment; a refund of an additional charge is recorded on that charge's own
 * element of the `additional_charges` jsonb array (its `refunded` figure), so
 * callers pass that through additionalRefundedTotal(). */
export interface CollectableSale {
  amountTotal: number | null;
  additionalChargesTotal?: number | null;
  refundedAmount: number | null;
  // Sum of refunds issued against additional charges — derive it from the raw
  // `additional_charges` column with additionalRefundedTotal().
  additionalRefundedTotal?: number | null;
}

export function netCollected(sale: CollectableSale): number {
  const gross = (sale.amountTotal ?? 0) + (sale.additionalChargesTotal ?? 0);
  const net = gross - (sale.refundedAmount ?? 0) - (sale.additionalRefundedTotal ?? 0);
  return Math.round(Math.max(0, net) * 100) / 100;
}

function toMoney(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/* The refunded figure on one element of `orders.additional_charges` /
 * `vendor_bookings.additional_charges` ({id, amount, createdAt, fee?,
 * refunded?, refunds?}). Elements written before charge-more refunds existed
 * carry no `refunded` key and count as nothing refunded. */
export function additionalChargeRefunded(charge: unknown): number {
  if (!charge || typeof charge !== 'object' || Array.isArray(charge)) return 0;
  return toMoney((charge as Record<string, unknown>).refunded);
}

/* Total refunded across every additional charge on a sale, from the raw
 * jsonb column. */
export function additionalRefundedTotal(rawCharges: unknown): number {
  if (!Array.isArray(rawCharges)) return 0;
  const total = rawCharges.reduce<number>((sum, c) => sum + additionalChargeRefunded(c), 0);
  return Math.round(total * 100) / 100;
}

/* The status a sale must reach before its money counts as collected.
 * NOTE: this schema's vendor bookings go `approved` → `paid`. Legacy used
 * `confirmed`, which does not exist here — filtering on it silently matched
 * zero rows and zeroed out all vendor revenue. */
export const SETTLED_ORDER_STATUS = 'paid';
export const SETTLED_BOOKING_STATUS = 'paid';
