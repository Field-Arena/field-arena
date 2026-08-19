import type { SALE_TYPES, SALE_STATUSES } from '@/modules/sales/constants';

export type SaleType = (typeof SALE_TYPES)[number];
export type SaleStatus = (typeof SALE_STATUSES)[number];

/** One unified Event Sales ledger row — built by data/queries.ts's listSales from an `orders` or `vendor_bookings` row. */
export interface SaleRow {
  id: string;
  saleType: 'order' | 'vendor_booking';
  type: SaleType;
  customer: string;
  showId: string;
  showName: string;
  /** paid_at when known, else created_at — matches what the design calls "Date". */
  date: string | null;
  amountTotal: number;
  feeTotal: number;
  refundedAmount: number;
  additionalChargesTotal: number;
  status: SaleStatus;
  /** amountTotal - feeTotal - refundedAmount, floored at 0 — what a refund may still take. */
  maxRefundable: number;
  hasSavedCard: boolean;
  stripePaymentIntentId: string | null;
}

/** The four Event Sales KPI tiles — see utils/compute-sales-stats.ts. */
export interface SalesStats {
  totalSales: number;
  refundedExcluded: number;
  transactions: number;
  riderCount: number;
  riderTotal: number;
  vendorCount: number;
  vendorTotal: number;
}
