'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { readableError } from '@/shared/lib/error-message';
import { startStripeConnect } from '@/modules/organizations/data/mutations';

export function useStartStripeConnect() {
  return useMutation({
    mutationFn: () => startStripeConnect(),
    onSuccess: ({ url }) => {
      window.location.href = url;
    },
    onError: (error) => {
      toast.error(readableError(error, 'Could not start Stripe onboarding'));
    },
  });
}
