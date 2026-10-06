// class_entries carries no fee of its own; the price actually charged lives on
// the paid order's line items. Money totals use that when it exists, so a fee
// edited after riders paid doesn't rewrite what they were charged, and fall
// back to the class's current fee for entries nobody has paid for yet.

interface OrderItemLike {
  kind?: string;
  classId?: string;
  horseId?: string | null;
  amount?: number;
}

export interface ChargeableOrder {
  id: string;
  status: string | null;
  items: unknown;
}

export interface ChargeableEntry {
  class_id: string;
  horse_id?: string | null;
  order_id: string | null;
  status: string | null;
}

export function isScratched(entry: { status: string | null }): boolean {
  return entry.status === 'scratched';
}

/** The amount a paid order charged for this entry's class (and horse), or null. */
export function paidAmountForEntry(
  entry: ChargeableEntry,
  orderById: Map<string, ChargeableOrder>,
): number | null {
  if (!entry.order_id) return null;
  const order = orderById.get(entry.order_id);
  if (order?.status !== 'paid' || !Array.isArray(order.items)) return null;
  const items = order.items as OrderItemLike[];
  const sameClass = items.filter((i) => i.kind === 'class_entry' && i.classId === entry.class_id);
  const match =
    (entry.horse_id ? sameClass.find((i) => i.horseId === entry.horse_id) : undefined) ??
    sameClass.find((i) => !i.horseId || !entry.horse_id);
  return typeof match?.amount === 'number' ? match.amount : null;
}

/** What this entry is worth in a collectible total: 0 when scratched, else charged-or-current fee. */
export function collectibleFeeForEntry(
  entry: ChargeableEntry,
  currentFee: number,
  orderById: Map<string, ChargeableOrder>,
): number {
  if (isScratched(entry)) return 0;
  return paidAmountForEntry(entry, orderById) ?? currentFee;
}
