'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { readableError } from '@/shared/lib/error-message';
import { saveStablingDates } from '../data/mutations';
import type { StablingSaveInput } from '../schemas';

export function useSaveStablingDates(options?: { onSuccess?: () => void }) {
  return useMutation({
    mutationFn: (input: StablingSaveInput) => saveStablingDates(input),
    onSuccess: () => {
      toast.success('Saved — the show has your dates.');
      options?.onSuccess?.();
    },
    onError: (error) => {
      toast.error(readableError(error, 'Could not save your stabling dates'));
    },
  });
}
