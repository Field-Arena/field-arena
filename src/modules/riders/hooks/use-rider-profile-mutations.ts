'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { readableError } from '@/shared/lib/error-message';
import { updateRiderProfile } from '@/modules/riders/data/mutations';
import type { RiderProfileUpdateInput } from '@/modules/riders/schemas';

export function useUpdateRiderProfile(options?: { onSuccess?: () => void }) {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: RiderProfileUpdateInput) => updateRiderProfile(input),
    onSuccess: () => {
      toast.success('Saved.');
      // ProfileTab reads its fields straight from the `rider` prop, not local
      // state — without this, a save left the field showing its old value
      // until something else on the page happened to trigger a refresh.
      router.refresh();
      options?.onSuccess?.();
    },
    onError: (error) => {
      toast.error(readableError(error, 'Could not save your details'));
    },
  });
}
