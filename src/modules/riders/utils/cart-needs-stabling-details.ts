import type { AddOnWithRemaining } from '@/modules/riders/types';

export function cartNeedsStablingDetails(
  addOnQuantities: Record<string, number>,
  addOns: AddOnWithRemaining[],
): boolean {
  const addOnById = new Map(addOns.map((addOn) => [addOn.id, addOn]));
  return Object.entries(addOnQuantities).some(([addOnId, qty]) => {
    if (qty <= 0) return false;
    const addOn = addOnById.get(addOnId);
    return !!addOn && ((addOn.stalls ?? 0) > 0 || (addOn.tack ?? 0) > 0);
  });
}
