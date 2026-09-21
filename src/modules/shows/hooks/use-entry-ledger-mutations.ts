'use client';

import {
  updateEntryNumber,
  updateBridleNumber,
  updateBackNumber,
} from '@/modules/shows/data/entry-ledger-mutations';
import type {
  UpdateEntryNumberInput,
  UpdateBridleNumberInput,
  UpdateBackNumberInput,
} from '@/modules/shows/schemas';
import { useRefreshingMutation } from '@/shared/hooks/use-refreshing-mutation';

export function useUpdateEntryNumber() {
  return useRefreshingMutation((input: UpdateEntryNumberInput) => updateEntryNumber(input), {
    successMessage: 'Entry number updated',
    errorFallback: 'Could not update the entry number',
  });
}

export function useUpdateBridleNumber() {
  return useRefreshingMutation((input: UpdateBridleNumberInput) => updateBridleNumber(input), {
    successMessage: 'Bridle number updated',
    errorFallback: 'Could not update the bridle number',
  });
}

export function useUpdateBackNumber() {
  return useRefreshingMutation((input: UpdateBackNumberInput) => updateBackNumber(input), {
    successMessage: 'Back number updated',
    errorFallback: 'Could not update the back number',
  });
}
