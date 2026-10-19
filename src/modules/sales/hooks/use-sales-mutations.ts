'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { refundSale, chargeMore, refundAdditionalCharge } from '@/modules/sales/data/mutations';
import type {
  RefundSaleInput,
  ChargeMoreInput,
  RefundAdditionalChargeInput,
} from '@/modules/sales/schemas';
import type { RefundSaleResult } from '@/modules/sales/types';
import { readableError } from '@/shared/lib/error-message';

function message(error: unknown, fallback: string): string {
  return readableError(error, fallback);
}

function toastRefundResult(result: RefundSaleResult): void {
  if (result.transferReversalFailed) {
    toast.warning(
      "Refund sent, but it could not be pulled back from the organizer's payout — the sale is flagged for review.",
    );
  } else {
    toast.success('Refund sent');
  }
}

export function useRefundSale() {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: RefundSaleInput) => refundSale(input),
    onSuccess: (result) => {
      toastRefundResult(result);
      router.refresh();
    },
    onError: (error) => {
      toast.error(message(error, 'Could not process this refund'));
    },
  });
}

export function useRefundAdditionalCharge() {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: RefundAdditionalChargeInput) => refundAdditionalCharge(input),
    onSuccess: (result) => {
      toastRefundResult(result);
      router.refresh();
    },
    onError: (error) => {
      toast.error(message(error, 'Could not refund this additional charge'));
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
