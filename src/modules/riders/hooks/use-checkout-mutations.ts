'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { readableError } from '@/shared/lib/error-message';
import { unwrap } from '@/shared/lib/unwrap-action';
import { createCheckoutSession } from '../data/mutations';
import type { CreateCheckoutSessionInput } from '../schemas';

/**
 * Creates the Stripe Checkout Session and redirects the browser to Stripe's
 * hosted page. A full navigation (`window.location.href`), not a client-side
 * route push — the destination is a different origin entirely, matching
 * legacy's realPayNow (rider.html).
 */
export function useCreateCheckoutSession() {
  return useMutation({
    mutationFn: async (input: CreateCheckoutSessionInput) => unwrap(await createCheckoutSession(input)),
    onSuccess: (result) => {
      window.location.href = result.url;
    },
    onError: (error) => {
      toast.error(readableError(error, 'Could not start checkout'));
    },
  });
}
