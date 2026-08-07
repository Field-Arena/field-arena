'use client';

import { calcPlatformFee, calcPlatformFeeFlat8 } from '@/shared/lib/fees';
import { useEntryCartStore } from '../store';
import { useCreateCheckoutSession } from '../hooks/use-checkout-mutations';
import type { AddOnWithRemaining, ClassWithCapacity, QualTypeRow } from '../types';
import { Button } from '@/shared/ui/shadcn/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/shadcn/card';

/**
 * Client-side preview only — the real, authoritative total is computed
 * server-side by data/checkout.ts's priceCart at "Proceed to payment" time,
 * and Stripe's own hosted Checkout page is what the rider actually confirms
 * against. This mirrors legacy's own accepted approximation (rider.html's
 * feeFor()): the fee model here is always the platform default (no
 * organization's `fee_model` is threaded into this preview), so a GMO-rate
 * show's preview can undercount slightly — corrected the moment the real
 * cart is priced. shared/lib/fees.ts's own header comment is what licenses
 * reusing calcPlatformFee client-side like this at all: "imported by both
 * the Server Action that charges and the form that previews."
 */
export function CheckoutSummary({
  showId,
  classes,
  addOns,
  qualTypes,
}: {
  showId: string;
  classes: ClassWithCapacity[];
  addOns: AddOnWithRemaining[];
  qualTypes: QualTypeRow[];
}) {
  const selectedClassIds = useEntryCartStore((state) => state.selectedClassIds);
  const classHorseAssignments = useEntryCartStore((state) => state.classHorseAssignments);
  const qualSelections = useEntryCartStore((state) => state.qualSelections);
  const addOnQuantities = useEntryCartStore((state) => state.addOnQuantities);
  const createSession = useCreateCheckoutSession();

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
    total += horseIds.length * (classFee + calcPlatformFee(classFee, null) + qualTotal);
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Review &amp; pay</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-fa-muted">Estimated total</span>
          <span className="text-lg font-semibold text-forest">${total.toFixed(2)}</span>
        </div>
        {!canCheckout && (
          <p className="text-xs text-fa-muted">Choose at least one class or add-on to continue.</p>
        )}
        {canCheckout && !everyClassAssigned && (
          <p className="text-xs text-destructive">Assign a horse to every selected class to continue.</p>
        )}
        <Button
          type="button"
          className="w-full"
          disabled={!canCheckout || !everyClassAssigned || createSession.isPending}
          onClick={() => {
            const cart = [...selectedClassIds].flatMap((classId) => {
              const horseIds = (classHorseAssignments[classId] ?? []).filter(
                (id): id is string => Boolean(id)
              );
              const qualTypeIds = [...(qualSelections[classId] ?? [])];
              return horseIds.map((horseId) => ({ classId, horseId, qualTypeIds }));
            });
            const addOnLines = Object.entries(addOnQuantities)
              .filter(([, qty]) => qty > 0)
              .map(([addOnId, qty]) => ({ addOnId, qty }));
            createSession.mutate({ showId, cart, addOns: addOnLines });
          }}
        >
          {createSession.isPending ? 'Redirecting to checkout…' : 'Proceed to payment'}
        </Button>
      </CardContent>
    </Card>
  );
}
