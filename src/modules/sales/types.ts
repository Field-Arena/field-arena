import type { SALE_TYPES, SALE_STATUSES } from '@/modules/sales/constants';

export type SaleType = (typeof SALE_TYPES)[number];
export type SaleStatus = (typeof SALE_STATUSES)[number];

export type SaleLineItemGroup = 'Entry fees' | 'Qualifications' | 'Add-ons' | 'Vendor items';

export interface SaleLineItem {
  label: string;
  qty: number;
  unitPrice: number;
  amount: number;
  group: SaleLineItemGroup;
}

/* One "Charge more" payment on a sale, as the Event Sales screen sees it. Each
 * is its own PaymentIntent (`id`), refunded independently of the original
 * payment. */
export interface SaleAdditionalCharge {
  id: string;
  amount: number;
  refunded: number;
  // amount − platform fee − refunded: the platform fee on an additional
  // charge is held back exactly like on the original payment.
  maxRefundable: number;
  createdAt: string | null;
}

export interface SaleRow {
  id: string;
  saleType: 'order' | 'vendor_booking';
  type: SaleType;
  customer: string;
  showId: string;
  showName: string;

  date: string | null;
  amountTotal: number;
  feeTotal: number;
  refundedAmount: number;
  additionalChargesTotal: number;
  // Refunds issued against additional charges (not part of refundedAmount,
  // which tracks the original payment only).
  additionalRefundedTotal: number;
  additionalCharges: SaleAdditionalCharge[];
  status: SaleStatus;

  // Refundable on the ORIGINAL payment.
  maxRefundable: number;
  // True when the original payment or any additional charge still has a
  // refundable balance — drives whether the Refund action is enabled.
  hasRefundableBalance: boolean;
  hasSavedCard: boolean;
  stripePaymentIntentId: string | null;
  // Set when the sale needs a human: a dispute, an out-of-app refund, a
  // failed transfer reversal or an oversold add-on.
  reviewReason: string | null;
  items: SaleLineItem[];
}

/* One thing the refund dialog can refund on a sale. */
export interface RefundTarget {
  key: string;
  // null = the original payment.
  chargeId: string | null;
  // 1-based position among the additional charges; 0 for the original.
  chargeNumber: number;
  amount: number;
  maxRefundable: number;
  createdAt: string | null;
}

export interface SalesStats {
  totalSales: number;
  refundedExcluded: number;
  transactions: number;
  riderCount: number;
  riderTotal: number;
  vendorCount: number;
  vendorTotal: number;
}

export interface RefundSaleResult {
  // The customer was refunded, but pulling the money back from the
  // organizer's Connect transfer failed — the sale is flagged for review.
  transferReversalFailed: boolean;
}

export interface OrganizerRefundOutcome {
  refundId: string;
  transferId: string | null;
  transferReversalId: string | null;
  // Set when the refund went through but pulling it back from the
  // organizer's transfer did not. The refund itself is never undone.
  reversalError: string | null;
}
