'use client';

import { useEntryCartStore } from '@/modules/riders/store';
import { useCreateCheckoutSession } from '@/modules/riders/hooks/use-checkout-mutations';
import { buildCheckoutCartPayload } from '@/modules/riders/utils/build-checkout-cart-payload';
import { computeCartPreview } from '@/modules/riders/utils/compute-cart-preview';
import type { AddOnWithRemaining, ClassWithCapacity, QualTypeRow } from '@/modules/riders/types';
import { Button } from '@/shared/ui/shadcn/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/shadcn/card';

export function CheckoutSummary({
  showId,
  classes,
  addOns,
  qualTypes,
  feeModel,
  waiverSatisfied,
}: {
  showId: string;
  classes: ClassWithCapacity[];
  addOns: AddOnWithRemaining[];
  qualTypes: QualTypeRow[];

  feeModel: string | null;

  waiverSatisfied: boolean;
}) {
  const selectedClassIds = useEntryCartStore((state) => state.selectedClassIds);
  const classHorseAssignments = useEntryCartStore((state) => state.classHorseAssignments);
  const qualSelections = useEntryCartStore((state) => state.qualSelections);
  const addOnQuantities = useEntryCartStore((state) => state.addOnQuantities);
  const createSession = useCreateCheckoutSession();

  const { total, canCheckout, everyClassAssigned } = computeCartPreview({
    classes,
    addOns,
    qualTypes,
    selectedClassIds,
    classHorseAssignments,
    qualSelections,
    addOnQuantities,
    feeModel,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Review &amp; pay</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-fa-muted">Estimated total</span>
          <span className="text-forest text-lg font-semibold">${total.toFixed(2)}</span>
        </div>
        {!canCheckout && (
          <p className="text-fa-muted text-xs">Choose at least one class or add-on to continue.</p>
        )}
        {canCheckout && !everyClassAssigned && (
          <p className="text-destructive text-xs">
            Assign a horse to every selected class to continue.
          </p>
        )}
        {canCheckout && everyClassAssigned && !waiverSatisfied && (
          <p className="text-destructive text-xs">
            Sign this show&apos;s waiver above to continue.
          </p>
        )}
        <Button
          type="button"
          className="w-full"
          disabled={
            !canCheckout || !everyClassAssigned || !waiverSatisfied || createSession.isPending
          }
          onClick={() => {
            const payload = buildCheckoutCartPayload({
              selectedClassIds,
              classHorseAssignments,
              qualSelections,
              addOnQuantities,
            });
            createSession.mutate({ showId, cart: payload.cart, addOns: payload.addOns });
          }}
        >
          {createSession.isPending ? 'Redirecting to checkout…' : 'Proceed to payment'}
        </Button>
      </CardContent>
    </Card>
  );
}
