'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { readableError } from '@/shared/lib/error-message';
import { approveVendorBooking, rejectVendorBooking } from '@/modules/vendors/data/mutations';
import type { ReviewVendorBookingInput } from '@/modules/vendors/schemas';

export function useApproveVendorBooking() {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: ReviewVendorBookingInput) => approveVendorBooking(input),
    onSuccess: () => {
      toast.success('Application approved — the vendor can now pay their booth fee.');
      router.refresh();
    },
    onError: (error) => {
      toast.error(readableError(error, 'Could not approve this application'));
    },
  });
}

export function useRejectVendorBooking() {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: ReviewVendorBookingInput) => rejectVendorBooking(input),
    onSuccess: () => {
      toast.success('Application rejected');
      router.refresh();
    },
    onError: (error) => {
      toast.error(readableError(error, 'Could not reject this application'));
    },
  });
}
