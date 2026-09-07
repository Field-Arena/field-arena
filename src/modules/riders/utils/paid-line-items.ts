import type { OrderLineItem, RiderVisibleOrderRow } from '@/modules/riders/types';

export function paidLineItems(orders: RiderVisibleOrderRow[]): OrderLineItem[] {
  return orders
    .filter((order) => order.status === 'paid')
    .flatMap((order) => (order.items ?? []) as unknown as OrderLineItem[]);
}
