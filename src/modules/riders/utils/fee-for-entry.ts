import { paidLineItems } from '@/modules/riders/utils/paid-line-items';
import type { RiderVisibleOrderRow } from '@/modules/riders/types';

export function feeForEntry(
  orders: RiderVisibleOrderRow[],
  classId: string,
  horseId: string | null,
): number | null {
  const item = paidLineItems(orders).find(
    (i) => i.kind === 'class_entry' && i.classId === classId && (i.horseId ?? null) === horseId,
  );
  return item ? item.amount : null;
}
