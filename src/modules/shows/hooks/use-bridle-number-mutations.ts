'use client';

import {
  createNumberRange,
  deleteNumberRange,
  markNumberUnavailable,
  restoreNumberAvailability,
  assignBridleNumber,
} from '@/modules/shows/data/bridle-number-mutations';
import type {
  CreateNumberRangeInput,
  DeleteNumberRangeInput,
  MarkNumberUnavailableInput,
  RestoreNumberAvailabilityInput,
  AssignBridleNumberInput,
} from '@/modules/shows/schemas';
import { useRefreshingMutation } from '@/shared/hooks/use-refreshing-mutation';

export function useCreateNumberRange() {
  return useRefreshingMutation((input: CreateNumberRangeInput) => createNumberRange(input), {
    successMessage: 'Number range added',
    errorFallback: 'Could not add that number range',
  });
}

export function useDeleteNumberRange() {
  return useRefreshingMutation((input: DeleteNumberRangeInput) => deleteNumberRange(input), {
    successMessage: 'Number range removed',
    errorFallback: 'Could not remove that number range',
  });
}

export function useMarkNumberUnavailable() {
  return useRefreshingMutation(
    (input: MarkNumberUnavailableInput) => markNumberUnavailable(input),
    {
      successMessage: 'Number marked unavailable',
      errorFallback: 'Could not mark that number unavailable',
    },
  );
}

export function useRestoreNumberAvailability() {
  return useRefreshingMutation(
    (input: RestoreNumberAvailabilityInput) => restoreNumberAvailability(input),
    {
      successMessage: 'Number restored to available',
      errorFallback: 'Could not restore that number',
    },
  );
}

export function useAssignBridleNumber(options?: { onSuccess?: () => void }) {
  return useRefreshingMutation((input: AssignBridleNumberInput) => assignBridleNumber(input), {
    successMessage: (data) => `Bridle number ${data.bridleNumber} assigned`,
    errorFallback: 'Could not assign a bridle number',
    onSuccess: options?.onSuccess,
  });
}
