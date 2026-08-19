import { calcPlatformFee, calcPlatformFeeFlat8 } from '@/shared/lib/fees';
import type { AddOnWithRemaining, ClassWithCapacity, QualTypeRow } from '@/modules/riders/types';

export interface CartPreview {
  total: number;
  lineCount: number;
  hasAddOns: boolean;
  canCheckout: boolean;
  /** Every selected class has at least one horse slot assigned. */
  everyClassAssigned: boolean;
}

/**
 * Client-side cart total preview, shared by CheckoutSummary (the real "Review
 * & pay" card) and RiderDemoPaymentStep (its demo-mode stand-in) so the two
 * fee calculations can never drift apart. See CheckoutSummary's own comment
 * for why this is only ever a preview, never the authoritative total (that's
 * data/checkout.ts's priceCart, computed server-side at "Proceed to payment"
 * time).
 */
export function computeCartPreview({
  classes,
  addOns,
  qualTypes,
  selectedClassIds,
  classHorseAssignments,
  qualSelections,
  addOnQuantities,
  countUnassignedClassAsOneLine = false,
}: {
  classes: ClassWithCapacity[];
  addOns: AddOnWithRemaining[];
  qualTypes: QualTypeRow[];
  selectedClassIds: Set<string>;
  classHorseAssignments: Record<string, (string | null)[]>;
  qualSelections: Record<string, Set<string>>;
  addOnQuantities: Record<string, number>;
  /**
   * The real CheckoutSummary requires an assigned horse for a class to count
   * toward the total (`horseIds.length`, possibly 0); the demo stand-in never
   * blocks itself on horse assignment, so an unassigned class still counts as
   * one line (`horseIds.length || 1`) — see RiderDemoPaymentStep's own
   * comment. Defaults to the real (stricter) behavior.
   */
  countUnassignedClassAsOneLine?: boolean;
}): CartPreview {
  const classById = new Map(classes.map((cls) => [cls.id, cls]));
  const qualById = new Map(qualTypes.map((qual) => [qual.id, qual]));
  const addOnById = new Map(addOns.map((addOn) => [addOn.id, addOn]));

  let total = 0;
  let lineCount = 0;
  for (const classId of selectedClassIds) {
    const cls = classById.get(classId);
    if (!cls) continue;
    const horseIds = (classHorseAssignments[classId] ?? []).filter((id): id is string => Boolean(id));
    const qualTotal = [...(qualSelections[classId] ?? [])].reduce((sum, qualId) => {
      const qual = qualById.get(qualId);
      const price = qual?.price ?? 0;
      return qual ? sum + price + calcPlatformFeeFlat8(price) : sum;
    }, 0);
    const classFee = cls.fee ?? 0;
    const lines = countUnassignedClassAsOneLine ? horseIds.length || 1 : horseIds.length;
    total += lines * (classFee + calcPlatformFee(classFee, null) + qualTotal);
    lineCount += horseIds.length;
  }
  for (const [addOnId, qty] of Object.entries(addOnQuantities)) {
    if (qty <= 0) continue;
    const addOn = addOnById.get(addOnId);
    if (!addOn) continue;
    const price = addOn.price ?? 0;
    total += qty * (price + calcPlatformFeeFlat8(price));
  }

  const hasAddOns = Object.values(addOnQuantities).some((qty) => qty > 0);
  const canCheckout = lineCount > 0 || hasAddOns;
  // Every selected class needs at least one horse assigned before this is a
  // real cart — the narrower version of legacy's realValidateDetails gate,
  // since rider details and the waiver are already required earlier on this
  // page rather than at this final step.
  const everyClassAssigned = [...selectedClassIds].every((classId) =>
    (classHorseAssignments[classId] ?? []).some(Boolean)
  );

  return { total, lineCount, hasAddOns, canCheckout, everyClassAssigned };
}
