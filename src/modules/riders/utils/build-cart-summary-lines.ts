import { calcPlatformFee, calcPlatformFeeFlat8 } from '@/shared/lib/fees';
import { anyClassFlaggedQualifying, isClassRated } from '@/modules/riders/utils/class-rated-status';
import type { ClassWithCapacity, HorseWithDocumentUrls, QualTypeRow } from '@/modules/riders/types';

export interface CartSummaryLine {
  key: string;
  className: string;
  rated: boolean;
  horseName: string | null;
  qualNames: string[];
  /** All-in price for this one entry (class fee + platform fee + any
   * qualifications), the same figure the cart total adds up. */
  amount: number;
}

/** One row per (class, horse) the rider has picked, for the cart summary.
 * A class with no horse assigned yet still gets one row, so the rider can see
 * it is in the cart. */
export function buildCartSummaryLines({
  classes,
  horses,
  qualTypes,
  selectedClassIds,
  classHorseAssignments,
  qualSelections,
  showType,
  feeModel,
}: {
  classes: ClassWithCapacity[];
  horses: HorseWithDocumentUrls[];
  qualTypes: QualTypeRow[];
  selectedClassIds: Set<string>;
  classHorseAssignments: Record<string, (string | null)[]>;
  qualSelections: Record<string, Set<string>>;
  showType: string | null;
  feeModel: string | null;
}): CartSummaryLine[] {
  const classById = new Map(classes.map((cls) => [cls.id, cls]));
  const horseById = new Map(horses.map((horse) => [horse.id, horse]));
  const qualById = new Map(qualTypes.map((qual) => [qual.id, qual]));
  const anyClassFlagged = anyClassFlaggedQualifying(classes);

  const lines: CartSummaryLine[] = [];
  for (const classId of selectedClassIds) {
    const cls = classById.get(classId);
    if (!cls) continue;
    const quals = [...(qualSelections[classId] ?? [])]
      .map((id) => qualById.get(id))
      .filter((qual): qual is QualTypeRow => Boolean(qual));
    const qualTotal = quals.reduce((sum, qual) => {
      const price = qual.price ?? 0;
      return sum + price + calcPlatformFeeFlat8(price);
    }, 0);
    const classFee = cls.fee ?? 0;
    const amount = classFee + calcPlatformFee(classFee, feeModel) + qualTotal;
    const rated = isClassRated(cls, { showType, anyClassFlagged });
    const className = (cls.display_name?.trim() ?? '') || cls.label;

    const horseIds = (classHorseAssignments[classId] ?? []).filter((id): id is string =>
      Boolean(id),
    );
    const slots: (string | null)[] = horseIds.length > 0 ? horseIds : [null];
    slots.forEach((horseId, index) => {
      lines.push({
        key: `${classId}-${index.toString()}`,
        className,
        rated,
        horseName: horseId ? (horseById.get(horseId)?.name ?? null) : null,
        qualNames: quals.map((qual) => qual.name),
        amount,
      });
    });
  }
  return lines;
}
