'use client';

import { useEntryCartStore } from '@/modules/riders/store';
import { useCreateCheckoutSession } from '@/modules/riders/hooks/use-checkout-mutations';
import { buildCheckoutCartPayload } from '@/modules/riders/utils/build-checkout-cart-payload';
import { computeCartPreview } from '@/modules/riders/utils/compute-cart-preview';
import { cartNeedsStablingDetails } from '@/modules/riders/utils/cart-needs-stabling-details';
import { buildCartSummaryLines } from '@/modules/riders/utils/build-cart-summary-lines';
import { RatedBadge } from '@/modules/riders/ui/rated-badge';
import type {
  AddOnWithRemaining,
  ClassWithCapacity,
  HorseWithDocumentUrls,
  QualTypeRow,
} from '@/modules/riders/types';
import { Button } from '@/shared/ui/shadcn/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/shadcn/card';

export function CheckoutSummary({
  showId,
  classes,
  addOns,
  qualTypes,
  horses,
  showType,
  feeModel,
  waiverSatisfied,
}: {
  showId: string;
  classes: ClassWithCapacity[];
  addOns: AddOnWithRemaining[];
  qualTypes: QualTypeRow[];
  horses: HorseWithDocumentUrls[];
  showType: string | null;

  feeModel: string | null;

  waiverSatisfied: boolean;
}) {
  const selectedClassIds = useEntryCartStore((state) => state.selectedClassIds);
  const classHorseAssignments = useEntryCartStore((state) => state.classHorseAssignments);
  const qualSelections = useEntryCartStore((state) => state.qualSelections);
  const addOnQuantities = useEntryCartStore((state) => state.addOnQuantities);
  const testChoices = useEntryCartStore((state) => state.testChoices);
  const divisionChoices = useEntryCartStore((state) => state.divisionChoices);
  const stablingDetails = useEntryCartStore((state) => state.stablingDetails);
  const createSession = useCreateCheckoutSession();

  const needsStablingDetails = cartNeedsStablingDetails(addOnQuantities, addOns);
  const stablingSatisfied = !needsStablingDetails || stablingDetails.trainerName.trim().length > 0;

  const classById = new Map(classes.map((cls) => [cls.id, cls]));
  const everyTestChosen = [...selectedClassIds].every((classId) => {
    const cls = classById.get(classId);
    const hasTestOptions = Array.isArray(cls?.test_options) && cls.test_options.length > 0;
    if (!hasTestOptions) return true;
    return Boolean(testChoices[classId]);
  });

  const everyDivisionChosen = [...selectedClassIds].every((classId) =>
    Boolean(divisionChoices[classId]),
  );

  const summaryLines = buildCartSummaryLines({
    classes,
    horses,
    qualTypes,
    selectedClassIds,
    classHorseAssignments,
    qualSelections,
    showType,
    feeModel,
  });

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
        {summaryLines.length > 0 && (
          <ul className="divide-line border-line divide-y rounded-lg border bg-white">
            {summaryLines.map((line) => (
              <li key={line.key} className="flex items-center justify-between gap-3 px-3 py-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-forest text-sm font-medium">{line.className}</span>
                    <RatedBadge rated={line.rated} />
                  </div>
                  <div className="text-fa-muted text-xs">
                    {line.horseName ?? 'No horse chosen yet'}
                    {line.qualNames.length > 0 ? ` · ${line.qualNames.join(', ')}` : ''}
                  </div>
                </div>
                <span className="text-forest text-sm font-semibold">${line.amount.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        )}
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
        {canCheckout && everyClassAssigned && !everyDivisionChosen && (
          <p className="text-destructive text-xs">
            Choose your division (Open, Adult Amateur, Young Rider or Junior) for every class to
            continue.
          </p>
        )}
        {canCheckout && everyClassAssigned && everyDivisionChosen && !everyTestChosen && (
          <p className="text-destructive text-xs">
            Choose a test for every Test of Choice class to continue.
          </p>
        )}
        {canCheckout &&
          everyClassAssigned &&
          everyDivisionChosen &&
          everyTestChosen &&
          !waiverSatisfied && (
            <p className="text-destructive text-xs">
              Sign this show&apos;s waiver above (type your name and tick &ldquo;I agree&rdquo;) to
              continue.
            </p>
          )}
        {canCheckout &&
          everyClassAssigned &&
          everyDivisionChosen &&
          everyTestChosen &&
          waiverSatisfied &&
          !stablingSatisfied && (
            <p className="text-destructive text-xs">
              Fill in the trainer/barn name in Stabling details above to continue.
            </p>
          )}
        <Button
          type="button"
          className="w-full"
          disabled={
            !canCheckout ||
            !everyClassAssigned ||
            !everyDivisionChosen ||
            !everyTestChosen ||
            !waiverSatisfied ||
            !stablingSatisfied ||
            createSession.isPending
          }
          onClick={() => {
            const payload = buildCheckoutCartPayload({
              selectedClassIds,
              classHorseAssignments,
              qualSelections,
              addOnQuantities,
              testChoices,
              divisionChoices,
            });
            createSession.mutate({
              showId,
              cart: payload.cart,
              addOns: payload.addOns,
              ...(needsStablingDetails
                ? {
                    stabling: {
                      trainerName: stablingDetails.trainerName.trim(),
                      stableWith: stablingDetails.stableWith.trim() || undefined,
                      notes: stablingDetails.notes.trim() || undefined,
                    },
                  }
                : {}),
            });
          }}
        >
          {createSession.isPending ? 'Redirecting to checkout…' : 'Proceed to payment'}
        </Button>
      </CardContent>
    </Card>
  );
}
