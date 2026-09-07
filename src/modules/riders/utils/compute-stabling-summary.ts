import { paidLineItems } from '@/modules/riders/utils/paid-line-items';
import type { AddOnRow, RiderVisibleOrderRow, StablingSummary } from '@/modules/riders/types';

export function computeStablingSummary(orders: RiderVisibleOrderRow[], addOns: AddOnRow[]): StablingSummary {
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
