'use client';

import { updateRiderProfile } from '@/modules/riders/data/mutations';
import type { RiderProfileUpdateInput } from '@/modules/riders/schemas';
import { useRefreshingMutation } from '@/shared/hooks/use-refreshing-mutation';

export function useUpdateRiderProfile(options?: { onSuccess?: () => void }) {
  // ProfileTab reads its fields straight from the `rider` prop, not local
  // state — without the refresh, a save left the field showing its old
  // value until something else on the page happened to trigger one.
  return useRefreshingMutation((input: RiderProfileUpdateInput) => updateRiderProfile(input), {
    successMessage: 'Saved.',
    errorFallback: 'Could not save your details',
    onSuccess: () => {
      options?.onSuccess?.();
    },
  });
}
