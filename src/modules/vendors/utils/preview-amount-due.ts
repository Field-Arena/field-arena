import { calcPlatformFeeFlat8 } from '@/shared/lib/fees';

/**
 * Client-preview only — the real total is priced server-side at "Pay now"
 * time by data/checkout.ts's priceVendorBooking. Same all-in-flat-8% formula,
 * just computed from the plain catalog prices listMyBookings already returns.
 */
export function previewAmountDue(items: { qty: number; price: number }[]): number {
  return items.reduce((sum, item) => sum + item.qty * (item.price + calcPlatformFeeFlat8(item.price)), 0);
}
