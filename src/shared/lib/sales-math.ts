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
 *   collected = amount_total + additional_charges_total − refunded_amount
 *
 * additional_charges_total is separate from amount_total (chargeMore creates a
 * new PaymentIntent and never rewrites the original), so it has to be added,
 * not assumed included. */
export interface CollectableSale {
  amountTotal: number | null;
  additionalChargesTotal?: number | null;
  refundedAmount: number | null;
}

export function netCollected(sale: CollectableSale): number {
  const gross = (sale.amountTotal ?? 0) + (sale.additionalChargesTotal ?? 0);
  const net = gross - (sale.refundedAmount ?? 0);
  return Math.round(Math.max(0, net) * 100) / 100;
}

/* The status a sale must reach before its money counts as collected.
 * NOTE: this schema's vendor bookings go `approved` → `paid`. Legacy used
 * `confirmed`, which does not exist here — filtering on it silently matched
 * zero rows and zeroed out all vendor revenue. */
export const SETTLED_ORDER_STATUS = 'paid';
export const SETTLED_BOOKING_STATUS = 'paid';
