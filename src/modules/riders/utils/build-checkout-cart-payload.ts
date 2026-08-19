import type { CheckoutAddOnLine, CheckoutCartLine } from '@/modules/riders/schemas';

export interface CheckoutCartPayload {
  cart: CheckoutCartLine[];
  addOns: CheckoutAddOnLine[];
}

/**
 * Shapes the entry cart store's selection state into createCheckoutSession's
 * `{ cart, addOns }` input, right before "Proceed to payment" fires the real
 * mutation. Split out of CheckoutSummary so that component stays render +
 * event wiring only, per .claude/rules/architecture.md's "UI does not
 * compute business logic."
 */
export function buildCheckoutCartPayload({
  selectedClassIds,
  classHorseAssignments,
  qualSelections,
  addOnQuantities,
}: {
  selectedClassIds: Set<string>;
  classHorseAssignments: Record<string, (string | null)[]>;
  qualSelections: Record<string, Set<string>>;
  addOnQuantities: Record<string, number>;
}): CheckoutCartPayload {
  const cart = [...selectedClassIds].flatMap((classId) => {
    const horseIds = (classHorseAssignments[classId] ?? []).filter((id): id is string => Boolean(id));
    const qualTypeIds = [...(qualSelections[classId] ?? [])];
    return horseIds.map((horseId) => ({ classId, horseId, qualTypeIds }));
  });
  const addOns = Object.entries(addOnQuantities)
    .filter(([, qty]) => qty > 0)
    .map(([addOnId, qty]) => ({ addOnId, qty }));

  return { cart, addOns };
}
