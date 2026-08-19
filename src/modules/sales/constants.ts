/**
 * Event Sales — the transactions ledger for one show's paid rider entries
 * and vendor bookings, ported from showstaff.html's renderEventSales /
 * allSalesRecords / updateSalesTable.
 */

export const SALE_TYPES = ['Rider', 'Vendor'] as const;

export const SALE_STATUSES = ['paid', 'partial', 'refunded'] as const;

export const SALES_PAGE_SIZE = 20;

/**
 * Refund-amount rounding tolerance in dollars — guards against float drift
 * when comparing a typed amount to maxRefundable (e.g. 25.999999999999996 vs
 * 26). Shared by data/mutations.ts's server-side check and
 * ui/refund-dialog.tsx's client-side validation so both agree on the same
 * boundary.
 */
export const REFUND_AMOUNT_EPSILON = 0.001;

/** Optimistic-concurrency retry cap for recording a charge after Stripe already took the money — see data/mutations.ts's chargeMore. */
export const MAX_CHARGE_RECORD_ATTEMPTS = 5;
