import { calcPlatformFeeFlat8 } from '@/shared/lib/fees';

/* Must agree to the cent with priceVendorBooking (modules/vendors/data/checkout),
 * which is what Stripe actually charges: round the all-in UNIT price to cents
 * first, then multiply by qty, then round the sum.
 *
 * Multiplying the unrounded unit price instead let this label drift a cent from
 * the real charge — the button said one number and the card was charged another.
 * No current catalog price triggers it, but "no current price triggers it" is
 * not a property worth relying on for a figure shown next to a Pay button. */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function previewAmountDue(items: { qty: number; price: number }[]): number {
  return round2(
    items.reduce((sum, item) => {
      const unit = round2(item.price + calcPlatformFeeFlat8(item.price));
      return sum + round2(unit * item.qty);
    }, 0),
  );
}
