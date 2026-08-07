'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { readableError } from '@/shared/lib/error-message';
import { signWaiver } from '../data/mutations';
import type { WaiverSignInput } from '../schemas';

export function useSignWaiver(options?: { onSuccess?: () => void }) {
  return useMutation({
    mutationFn: (input: WaiverSignInput) => signWaiver(input),
    onSuccess: () => {
      options?.onSuccess?.();
    },
    onError: (error) => {
      toast.error(readableError(error, 'Could not sign the waiver'));
    },
  });
}
