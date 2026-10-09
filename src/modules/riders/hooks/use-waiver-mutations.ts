'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { readableError } from '@/shared/lib/error-message';
import { signRequiredDocument, signWaiver } from '@/modules/riders/data/mutations';
import type { RequiredDocumentSignInput, WaiverSignInput } from '@/modules/riders/schemas';

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

export function useSignRequiredDocument(options?: { onSuccess?: () => void }) {
  return useMutation({
    mutationFn: (input: RequiredDocumentSignInput) => signRequiredDocument(input),
    onSuccess: ({ signedHorseCount }) => {
      toast.success(
        signedHorseCount > 1
          ? `Signed — filed for all ${signedHorseCount.toString()} of your horses.`
          : 'Signed.',
      );
      options?.onSuccess?.();
    },
    onError: (error) => {
      toast.error(readableError(error, 'Could not sign this document'));
    },
  });
}
