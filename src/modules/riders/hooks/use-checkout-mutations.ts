'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { readableError } from '@/shared/lib/error-message';
import { unwrap } from '@/shared/lib/unwrap-action';
import { createCheckoutSession } from '@/modules/riders/data/mutations';
import type { CreateCheckoutSessionInput } from '@/modules/riders/schemas';

export function useCreateCheckoutSession() {
  return useMutation({
    mutationFn: async (input: CreateCheckoutSessionInput) =>
      unwrap(await createCheckoutSession(input)),
    onSuccess: (result) => {
      window.location.href = result.url;
    },
    onError: (error) => {
      toast.error(readableError(error, 'Could not start checkout'));
    },
  });
}
