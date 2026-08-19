'use client';

import { useEntryCartStore } from '@/modules/riders/store';
import { computeCartPreview } from '@/modules/riders/utils/compute-cart-preview';
import type { AddOnWithRemaining, ClassWithCapacity, QualTypeRow } from '@/modules/riders/types';
import { Button } from '@/shared/ui/shadcn/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/shadcn/card';

/**
 * Demo-only stand-in for the real `CheckoutSummary` — that component's "Proceed
 * to payment" button calls `useCreateCheckoutSession`, a real Server Action
 * that creates a real Stripe Checkout Session. The SuperAdmin "Demo" button
 * must never do that (legacy's own fake `payNow`: no charge, no order). Same
 * total math (`computeCartPreview`) as the real component for an
 * accurate-looking preview; "Pay now" just advances the walkthrough.
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

  const { total } = computeCartPreview({
    classes,
    addOns,
    qualTypes,
    selectedClassIds,
    classHorseAssignments,
    qualSelections,
    addOnQuantities,
    // The demo never blocks itself on horse assignment (there is no
    // ClassHorseAssignment step), so an unassigned class still counts as one
    // line in this preview — see computeCartPreview's own comment.
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
