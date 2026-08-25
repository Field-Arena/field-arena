'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { readableError } from '@/shared/lib/error-message';
import { applyToShowPublic } from '@/modules/vendors/data/mutations';
import type { ApplyToShowPublicInput } from '@/modules/vendors/schemas';

export function useApplyToShowPublic() {
  return useMutation({
    mutationFn: (input: ApplyToShowPublicInput) => applyToShowPublic(input),
    onSuccess: () => {
      toast.success('Application submitted — the organizer will review it.');
    },
    onError: (error: unknown) => {
      toast.error(readableError(error, 'Could not submit your application'));
    },
  });
}
