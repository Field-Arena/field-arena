'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { readableError } from '@/shared/lib/error-message';
import { createVendorCheckoutSession } from '../data/mutations';
import type { CreateVendorCheckoutSessionInput } from '../schemas';

/**
 * Creates the Stripe Checkout Session for a booth fee and redirects the
 * browser to Stripe's hosted page. A full navigation
 * (`window.location.href`), not a client-side route push — the destination
 * is a different origin entirely. Mirrors
 * modules/riders/hooks/use-checkout-mutations.ts's useCreateCheckoutSession
 * exactly.
 */
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
