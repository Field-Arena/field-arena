'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { readableError } from '@/shared/lib/error-message';
import { updateRiderProfile } from '@/modules/riders/data/mutations';
import type { RiderProfileUpdateInput } from '@/modules/riders/schemas';

export function useUpdateRiderProfile(options?: { onSuccess?: () => void }) {
  return useMutation({
    mutationFn: (input: RiderProfileUpdateInput) => updateRiderProfile(input),
    onSuccess: () => {
      toast.success('Saved.');
      options?.onSuccess?.();
    },
    onError: (error) => {
      toast.error(readableError(error, 'Could not save your details'));
    },
  });
}
