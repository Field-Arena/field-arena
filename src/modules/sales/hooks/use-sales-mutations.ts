'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { refundSale, chargeMore } from '@/modules/sales/data/mutations';
import type { RefundSaleInput, ChargeMoreInput } from '@/modules/sales/schemas';
import { readableError } from '@/shared/lib/error-message';

function message(error: unknown, fallback: string): string {
  return readableError(error, fallback);
}

export function useRefundSale() {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: RefundSaleInput) => refundSale(input),
    onSuccess: () => {
      toast.success('Refund sent');
      router.refresh();
    },
    onError: (error) => {
      toast.error(message(error, 'Could not process this refund'));
    },
  });
}

export function useChargeMore() {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: ChargeMoreInput) => chargeMore(input),
    onSuccess: () => {
      toast.success('Card charged');
      router.refresh();
    },
    onError: (error) => {
      toast.error(message(error, 'Could not charge the saved card'));
    },
  });
}
