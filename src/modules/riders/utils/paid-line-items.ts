import type { OrderLineItem, OrderRow } from '@/modules/riders/types';

/**
 * Only orders that actually collected money count toward Purchases-tab
 * totals — mirrors legacy's realOrdersForShow filter. Shared by
 * fee-for-entry.ts, summarize-purchases.ts, and compute-stabling-summary.ts —
 * exported (not module-private) for exactly that reason, per
 * .claude/rules layer split of one exported function per utils file.
 */
export function paidLineItems(orders: OrderRow[]): OrderLineItem[] {
  return orders
    .filter((order) => order.status === 'paid')
    .flatMap((order) => (order.items ?? []) as unknown as OrderLineItem[]);
}
