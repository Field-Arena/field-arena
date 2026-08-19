import type { SALE_TYPES, SALE_STATUSES } from '@/modules/sales/constants';

export type SaleType = (typeof SALE_TYPES)[number];
export type SaleStatus = (typeof SALE_STATUSES)[number];

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
  status: SaleStatus;

  maxRefundable: number;
  hasSavedCard: boolean;
  stripePaymentIntentId: string | null;
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
