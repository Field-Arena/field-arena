'use client';

import { updateEntryNumber, updateBackNumber } from '@/modules/shows/data/entry-ledger-mutations';
import type { UpdateEntryNumberInput, UpdateBackNumberInput } from '@/modules/shows/schemas';
import { useRefreshingMutation } from '@/shared/hooks/use-refreshing-mutation';

export function useUpdateEntryNumber() {
  return useRefreshingMutation((input: UpdateEntryNumberInput) => updateEntryNumber(input), {
    successMessage: 'Entry number updated',
    errorFallback: 'Could not update the entry number',
  });
}

export function useUpdateBackNumber() {
  return useRefreshingMutation((input: UpdateBackNumberInput) => updateBackNumber(input), {
    successMessage: 'Back number updated',
    errorFallback: 'Could not update the back number',
  });
}
