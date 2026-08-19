'use client';

import { useEntryCartStore } from '@/modules/riders/store';
import { useCreateCheckoutSession } from '@/modules/riders/hooks/use-checkout-mutations';
import { buildCheckoutCartPayload } from '@/modules/riders/utils/build-checkout-cart-payload';
import { computeCartPreview } from '@/modules/riders/utils/compute-cart-preview';
import type { AddOnWithRemaining, ClassWithCapacity, QualTypeRow } from '@/modules/riders/types';
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
  waiverSatisfied,
}: {
  showId: string;
  classes: ClassWithCapacity[];
  addOns: AddOnWithRemaining[];
  qualTypes: QualTypeRow[];
  /**
   * `true` when the show has no waiver text, or the rider already has a
   * signature on file — `false` blocks checkout the same way an unassigned
   * horse does. Without this, "Proceed to payment" stayed clickable for a
   * rider who never scrolled up to sign, and the only feedback was
   * priceCart's server-side rejection — whose message Next.js redacts in
   * production (see readableError's doc comment), so the rider saw a bare
   * "Could not start checkout" with no indication why.
   */
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
  });

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
        {canCheckout && everyClassAssigned && !waiverSatisfied && (
          <p className="text-xs text-destructive">
            Sign this show&apos;s waiver above to continue.
          </p>
        )}
        <Button
          type="button"
          className="w-full"
          disabled={!canCheckout || !everyClassAssigned || !waiverSatisfied || createSession.isPending}
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
