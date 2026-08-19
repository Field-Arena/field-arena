import { paidLineItems } from '@/modules/riders/utils/paid-line-items';
import type { OrderRow } from '@/modules/riders/types';

/**
 * A class entry's fee, looked up from paid orders rather than the entry
 * itself — mirrors legacy's feeMap (rider.html's Purchases tab), keyed by
 * classId+horseId since the same class can be entered twice on two different
 * horses. Null (rendered as "—") when no paid line item matches, same as
 * legacy.
 */
export function feeForEntry(orders: OrderRow[], classId: string, horseId: string | null): number | null {
  const item = paidLineItems(orders).find(
    (i) => i.kind === 'class_entry' && i.classId === classId && (i.horseId ?? null) === horseId
  );
  return item ? item.amount : null;
}
