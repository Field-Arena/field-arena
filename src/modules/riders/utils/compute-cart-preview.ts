import { calcPlatformFee, calcPlatformFeeFlat8 } from '@/shared/lib/fees';
import type { AddOnWithRemaining, ClassWithCapacity, QualTypeRow } from '@/modules/riders/types';

export interface CartPreview {
  total: number;
  lineCount: number;
  hasAddOns: boolean;
  canCheckout: boolean;

  everyClassAssigned: boolean;
}

export function computeCartPreview({
  classes,
  addOns,
  qualTypes,
  selectedClassIds,
  classHorseAssignments,
  qualSelections,
  addOnQuantities,
  feeModel = null,
  countUnassignedClassAsOneLine = false,
}: {
  classes: ClassWithCapacity[];
  addOns: AddOnWithRemaining[];
  qualTypes: QualTypeRow[];
  selectedClassIds: Set<string>;
  classHorseAssignments: Record<string, (string | null)[]>;
  qualSelections: Record<string, Set<string>>;
  addOnQuantities: Record<string, number>;

  /* Must be the organizing org's real fee model. Passing null here quotes
   * every rider the default rule, which silently understates the total for a
   * GMO org (18% on class entries) — they would be charged more at checkout
   * than the summary showed them. */
  feeModel?: string | null;

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
    const horseIds = (classHorseAssignments[classId] ?? []).filter((id): id is string =>
      Boolean(id),
    );
    const qualTotal = [...(qualSelections[classId] ?? [])].reduce((sum, qualId) => {
      const qual = qualById.get(qualId);
      const price = qual?.price ?? 0;
      return qual ? sum + price + calcPlatformFeeFlat8(price) : sum;
    }, 0);
    const classFee = cls.fee ?? 0;
    const lines = countUnassignedClassAsOneLine ? horseIds.length || 1 : horseIds.length;
    total += lines * (classFee + calcPlatformFee(classFee, feeModel) + qualTotal);
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

  const everyClassAssigned = [...selectedClassIds].every((classId) =>
    (classHorseAssignments[classId] ?? []).some(Boolean),
  );

  return { total, lineCount, hasAddOns, canCheckout, everyClassAssigned };
}
