import { paidLineItems } from '@/modules/riders/utils/paid-line-items';
import type { AddOnRow, OrderRow, StablingSummary } from '@/modules/riders/types';

/**
 * Read-only stall/tack/shavings/night counts for the stabling form, derived
 * from paid add-on purchases joined against each add-on's own metadata
 * (`add_ons.stalls/tack/shavings/nights` — see that column's own comment in
 * 20260727120400_show_setup.sql). Stalls/tack/shavings scale with quantity
 * purchased; nights takes the max across add-ons rather than summing, since a
 * rider's length of stay isn't additive the way stall counts are — same rule
 * as legacy's saveStabling section (rider.html).
 */
export function computeStablingSummary(orders: OrderRow[], addOns: AddOnRow[]): StablingSummary {
  const addOnById = new Map(addOns.map((addOn) => [addOn.id, addOn]));
  const summary: StablingSummary = { stalls: 0, tack: 0, shavings: 0, nights: 0 };

  for (const item of paidLineItems(orders)) {
    if (item.kind !== 'addon' || !item.refId) continue;
    const addOn = addOnById.get(item.refId);
    if (!addOn) continue;
    summary.stalls += (addOn.stalls ?? 0) * item.qty;
    summary.tack += (addOn.tack ?? 0) * item.qty;
    summary.shavings += (addOn.shavings ?? 0) * item.qty;
    summary.nights = Math.max(summary.nights, addOn.nights ?? 0);
  }

  return summary;
}
