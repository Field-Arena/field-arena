'use client';

import { unwrap } from '@/shared/lib/unwrap-action';
import { useRefreshingMutation } from '@/shared/hooks/use-refreshing-mutation';
import { createJudge, deleteJudge, updateJudge } from '@/modules/judges/data/mutations';
import type { CreateJudgeInput, UpdateJudgeInput } from '@/modules/judges/schemas';

export function useCreateJudge(options?: { onSuccess?: () => void }) {
  return useRefreshingMutation(async (input: CreateJudgeInput) => unwrap(await createJudge(input)), {
    successMessage: 'Judge added',
    errorFallback: 'Could not add this judge',
    onSuccess: () => {
      options?.onSuccess?.();
    },
  });
}

export function useUpdateJudge(options?: { onSuccess?: () => void }) {
  return useRefreshingMutation(async (input: UpdateJudgeInput) => unwrap(await updateJudge(input)), {
    successMessage: 'Judge saved',
    errorFallback: 'Could not save this judge',
    onSuccess: () => {
      options?.onSuccess?.();
    },
  });
}

export function useDeleteJudge(options?: { onSuccess?: () => void }) {
  return useRefreshingMutation(async (id: string) => unwrap(await deleteJudge({ id })), {
    successMessage: 'Judge deleted',
    errorFallback: 'Could not delete this judge',
    onSuccess: () => {
      options?.onSuccess?.();
    },
  });
}
