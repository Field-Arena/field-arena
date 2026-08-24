'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { readableError } from '@/shared/lib/error-message';
import { createVendorCheckoutSession } from '@/modules/vendors/data/mutations';
import type { CreateVendorCheckoutSessionInput } from '@/modules/vendors/schemas';

export function useCreateVendorCheckoutSession() {
  return useMutation({
    mutationFn: (input: CreateVendorCheckoutSessionInput) => createVendorCheckoutSession(input),
    onSuccess: (result) => {
      window.location.href = result.url;
    },
    onError: (error) => {
      toast.error(readableError(error, 'Could not start checkout'));
    },
  });
}
