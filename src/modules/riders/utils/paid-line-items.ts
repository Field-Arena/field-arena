import type { OrderLineItem, OrderRow } from '@/modules/riders/types';

export function paidLineItems(orders: OrderRow[]): OrderLineItem[] {
  return orders
    .filter((order) => order.status === 'paid')
    .flatMap((order) => (order.items ?? []) as unknown as OrderLineItem[]);
}
