import type { SaleRow } from '@/modules/sales/types';

/* Strips every money figure from a sale before it leaves the server for a
 * caller without canViewMoney. Hiding the numbers in the UI is not enough —
 * the props would still carry them to the browser.
 *
 * maxRefundable survives only for a caller who holds canRefund: legacy kept
 * canRefund separate from canViewMoney, and the refund action needs to know
 * how much is left — the same goes for each additional charge's refundable
 * remainder (and its id, which the refund action needs to name the charge).
 * Without canRefund the additional charges are dropped entirely. */
export function redactSaleMoney(row: SaleRow, keepRefundable: boolean): SaleRow {
  return {
    ...row,
    amountTotal: 0,
    feeTotal: 0,
    refundedAmount: 0,
    additionalChargesTotal: 0,
    additionalRefundedTotal: 0,
    additionalCharges: keepRefundable
      ? row.additionalCharges.map((charge) => ({ ...charge, amount: 0, refunded: 0 }))
      : [],
    maxRefundable: keepRefundable ? row.maxRefundable : 0,
    hasRefundableBalance: keepRefundable ? row.hasRefundableBalance : false,
    stripePaymentIntentId: null,
    // The reason text can quote amounts; keep only the signal.
    reviewReason: row.reviewReason ? 'Needs review' : null,
    items: row.items.map((item) => ({ ...item, unitPrice: 0, amount: 0 })),
  };
}
