'use client';

import { calcPlatformFee, calcPlatformFeeFlat8 } from '@/shared/lib/fees';
import { useEntryCartStore } from '../store';
import type { AddOnWithRemaining, ClassWithCapacity, QualTypeRow } from '../types';
import { Button } from '@/shared/ui/shadcn/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/shadcn/card';

/**
 * Demo-only stand-in for the real `CheckoutSummary` — that component's "Proceed
 * to payment" button calls `useCreateCheckoutSession`, a real Server Action
 * that creates a real Stripe Checkout Session. The SuperAdmin "Demo" button
 * must never do that (legacy's own fake `payNow`: no charge, no order). Same
 * total math (`calcPlatformFee`/`calcPlatformFeeFlat8`) as the real component
 * for an accurate-looking preview; "Pay now" just advances the walkthrough.
 */
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

  const classById = new Map(classes.map((cls) => [cls.id, cls]));
  const qualById = new Map(qualTypes.map((qual) => [qual.id, qual]));
  const addOnById = new Map(addOns.map((addOn) => [addOn.id, addOn]));

  let total = 0;
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
    total += (horseIds.length || 1) * (classFee + calcPlatformFee(classFee, null) + qualTotal);
  }
  for (const [addOnId, qty] of Object.entries(addOnQuantities)) {
    if (qty <= 0) continue;
    const addOn = addOnById.get(addOnId);
    if (!addOn) continue;
    const price = addOn.price ?? 0;
    total += qty * (price + calcPlatformFeeFlat8(price));
  }

  return (
    <Card className="[animation:fa-in_.22s_ease-out_both]">
      <CardHeader>
        <CardTitle>Review &amp; pay</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-fa-muted">Estimated total</span>
          <span className="text-lg font-semibold text-forest">${total.toFixed(2)}</span>
        </div>
        <p className="text-xs text-fa-muted">
          Demo mode — no card is charged and no order is created.
        </p>
        <Button type="button" className="w-full" onClick={onNext}>
          Pay now
        </Button>
      </CardContent>
    </Card>
  );
}
