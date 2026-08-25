import { paidLineItems } from '@/modules/riders/utils/paid-line-items';
import type { OrderRow } from '@/modules/riders/types';

export function feeForEntry(
  orders: OrderRow[],
  classId: string,
  horseId: string | null,
): number | null {
  const item = paidLineItems(orders).find(
    (i) => i.kind === 'class_entry' && i.classId === classId && (i.horseId ?? null) === horseId,
  );
  return item ? item.amount : null;
}
