'use client';

import { Loader2Icon } from 'lucide-react';
import { formatMoney } from '@/shared/lib/format/currency';
import { FA_BTN_PRIMARY } from '@/shared/ui/organizer/fa-page';
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
    <button
      type="button"
      className={FA_BTN_PRIMARY}
      disabled={isPending}
      onClick={() => {
        mutate({ bookingId });
      }}
    >
      {isPending && <Loader2Icon className="size-4 animate-spin" aria-hidden />}
      {isPending
        ? 'Redirecting…'
        : `Pay now${amountDue !== null ? ` — ${formatMoney(amountDue)}` : ''}`}
    </button>
  );
}
