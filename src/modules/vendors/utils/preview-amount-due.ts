import { calcPlatformFeeFlat8 } from '@/shared/lib/fees';

export function previewAmountDue(items: { qty: number; price: number }[]): number {
  return items.reduce(
    (sum, item) => sum + item.qty * (item.price + calcPlatformFeeFlat8(item.price)),
    0,
  );
}
