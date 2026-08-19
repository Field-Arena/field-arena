'use client';

import { useEntryCartStore } from '@/modules/riders/store';
import { computeCartPreview } from '@/modules/riders/utils/compute-cart-preview';
import type { AddOnWithRemaining, ClassWithCapacity, QualTypeRow } from '@/modules/riders/types';
import { Button } from '@/shared/ui/shadcn/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/shadcn/card';

export function RiderDemoPaymentStep({
  classes,
  addOns,
  qualTypes,
  onNext,
}: {
  classes: ClassWithCapacity[];
  addOns: AddOnWithRemaining[];
  qualTypes: QualTypeRow[];
  onNext: () => void;
}) {
  const selectedClassIds = useEntryCartStore((state) => state.selectedClassIds);
  const classHorseAssignments = useEntryCartStore((state) => state.classHorseAssignments);
  const qualSelections = useEntryCartStore((state) => state.qualSelections);
  const addOnQuantities = useEntryCartStore((state) => state.addOnQuantities);

  const { total } = computeCartPreview({
    classes,
    addOns,
    qualTypes,
    selectedClassIds,
    classHorseAssignments,
    qualSelections,
    addOnQuantities,

    countUnassignedClassAsOneLine: true,
  });

  return (
    <Card className="[animation:fa-in_.22s_ease-out_both]">
      <CardHeader>
        <CardTitle>Review &amp; pay</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-fa-muted">Estimated total</span>
          <span className="text-forest text-lg font-semibold">${total.toFixed(2)}</span>
        </div>
        <p className="text-fa-muted text-xs">
          Demo mode — no card is charged and no order is created.
        </p>
        <Button type="button" className="w-full" onClick={onNext}>
          Pay now
        </Button>
      </CardContent>
    </Card>
  );
}
