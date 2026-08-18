'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { readableError } from '@/shared/lib/error-message';
import { startStripeConnect } from '@/modules/organizations/data/mutations';

/**
 * Opens Stripe Connect Express onboarding.
 *
 * Navigates rather than routing: the URL is Stripe's own hosted page, not a
 * route in this app, and the account link it returns is single-use and expires
 * within minutes — so it is followed immediately rather than stored.
 */
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
