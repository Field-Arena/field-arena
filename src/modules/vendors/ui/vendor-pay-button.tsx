'use client';

import { Loader2Icon } from 'lucide-react';
import { Button } from '@/shared/ui/shadcn/button';
import { formatMoney } from '@/shared/lib/format/currency';
import { useCreateVendorCheckoutSession } from '@/modules/vendors/hooks/use-vendor-checkout-mutations';

/**
 * "Pay now" for one approved booking — creates a real Stripe Checkout
 * Session and redirects to Stripe's hosted page, mirroring rider
 * checkout's own pay button. Only ever rendered for a booking whose status
 * is 'approved' (see app/(dashboard)/dashboard/vendor/page.tsx) — the
 * Server Action itself re-checks this, so this button is a UX affordance,
 * not the actual gate.
 */
export function VendorPayButton({
  bookingId,
  amountDue,
}: {
  bookingId: string;
  amountDue: number | null;
}) {
  const { mutate, isPending } = useCreateVendorCheckoutSession();

  return (
    <Button
      type="button"
      size="sm"
      disabled={isPending}
      onClick={() => {
        mutate({ bookingId });
      }}
    >
      {isPending && <Loader2Icon className="animate-spin" aria-hidden />}
      {isPending ? 'Redirecting…' : `Pay now${amountDue !== null ? ` — ${formatMoney(amountDue)}` : ''}`}
    </Button>
  );
}
