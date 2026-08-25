'use client';

import { Loader2Icon } from 'lucide-react';
import { Button } from '@/shared/ui/shadcn/button';
import { formatMoney } from '@/shared/lib/format/currency';
import { useCreateVendorCheckoutSession } from '@/modules/vendors/hooks/use-vendor-checkout-mutations';

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
      {isPending
        ? 'Redirecting…'
        : `Pay now${amountDue !== null ? ` — ${formatMoney(amountDue)}` : ''}`}
    </Button>
  );
}
