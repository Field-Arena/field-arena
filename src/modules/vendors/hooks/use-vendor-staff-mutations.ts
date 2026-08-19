'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { readableError } from '@/shared/lib/error-message';
import { approveVendorBooking, rejectVendorBooking } from '@/modules/vendors/data/mutations';
import type { ReviewVendorBookingInput } from '@/modules/vendors/schemas';

/**
 * Organizer/staff review of a pending vendor application — the missing half
 * of the pending → approved → paid flow createVendorCheckoutSession gates on.
 * Mirrors modules/vendors/hooks/use-vendor-mutations.ts's own hooks exactly,
 * just calling the staff-side Server Actions instead of the vendor's own.
 */

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
