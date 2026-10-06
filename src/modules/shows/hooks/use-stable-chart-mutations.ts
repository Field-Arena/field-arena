'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { readableError } from '@/shared/lib/error-message';
import { useRefreshingMutation } from '@/shared/hooks/use-refreshing-mutation';
import {
  setStableCount,
  updateStableField,
  generateStableStalls,
  renameStall,
  setStallStatus,
  unassignStall,
  updateStallNote,
  reassignStall,
  swapStalls,
  assignGroupToStable,
  toggleStableChartStatus,
  autoAssignStableStalls,
  applySavedLocationStables,
} from '@/modules/shows/data/stable-chart-mutations';
import type {
  SetStableCountInput,
  UpdateStableFieldInput,
  GenerateStableStallsInput,
  RenameStallInput,
  SetStallStatusInput,
  UnassignStallInput,
  UpdateStallNoteInput,
  ReassignStallInput,
  SwapStallsInput,
  AssignGroupToStableInput,
  ToggleStableChartStatusInput,
  AutoAssignStableStallsInput,
  ApplySavedLocationStablesInput,
} from '@/modules/shows/schemas';

export function useSetStableCount() {
  const router = useRouter();
  return useMutation({
    mutationFn: (input: SetStableCountInput) => setStableCount(input),
    onSuccess: () => {
      router.refresh();
    },
    onError: (error) => {
      toast.error(readableError(error, 'Could not update the stable count'));
    },
  });
}

export function useUpdateStableField() {
  const router = useRouter();
  return useMutation({
    mutationFn: (input: UpdateStableFieldInput) => updateStableField(input),
    onSuccess: () => {
      router.refresh();
    },
    onError: (error) => {
      toast.error(readableError(error, 'Could not save that change'));
    },
  });
}

export function useGenerateStableStalls() {
  const router = useRouter();
  return useMutation({
    mutationFn: (input: GenerateStableStallsInput) => generateStableStalls(input),
    onSuccess: () => {
      toast.success('Stalls updated');
      router.refresh();
    },
    onError: (error) => {
      toast.error(readableError(error, 'Could not generate stalls'));
    },
  });
}

export function useRenameStall() {
  const router = useRouter();
  return useMutation({
    mutationFn: (input: RenameStallInput) => renameStall(input),
    onSuccess: () => {
      router.refresh();
    },
    onError: (error) => {
      toast.error(readableError(error, 'Could not rename this stall'));
    },
  });
}

export function useSetStallStatus() {
  const router = useRouter();
  return useRefreshingMutation((input: SetStallStatusInput) => setStallStatus(input), {
    errorFallback: 'Could not update this stall',
    // Usually "the chart changed" — pull the current chart so the next try
    // starts from what's actually there.
    onError: () => {
      router.refresh();
    },
  });
}

export function useUnassignStall() {
  return useRefreshingMutation((input: UnassignStallInput) => unassignStall(input), {
    errorFallback: 'Could not unassign this stall',
  });
}

export function useUpdateStallNote() {
  return useRefreshingMutation((input: UpdateStallNoteInput) => updateStallNote(input), {
    errorFallback: 'Could not save that note',
  });
}

export function useReassignStall() {
  return useRefreshingMutation((input: ReassignStallInput) => reassignStall(input), {
    errorFallback: 'Could not move that horse',
  });
}

export function useSwapStalls() {
  return useRefreshingMutation((input: SwapStallsInput) => swapStalls(input), {
    errorFallback: 'Could not swap those stalls',
  });
}

export function useAssignGroupToStable() {
  return useRefreshingMutation((input: AssignGroupToStableInput) => assignGroupToStable(input), {
    errorFallback: 'Could not place that group',
  });
}

export function useToggleStableChartStatus() {
  const router = useRouter();
  return useRefreshingMutation(
    (input: ToggleStableChartStatusInput) => toggleStableChartStatus(input),
    {
      successMessage: 'Saved',
      errorFallback: 'Could not update the chart status',
      // Usually "the chart changed" — pull the current status so the button
      // shows what's actually there before the next click.
      onError: () => {
        router.refresh();
      },
    },
  );
}

export function useAutoAssignStableStalls() {
  const router = useRouter();
  return useMutation({
    mutationFn: (input: AutoAssignStableStallsInput) => autoAssignStableStalls(input),
    onSuccess: () => {
      toast.success('Horses assigned to empty stalls');
      router.refresh();
    },
    onError: (error) => {
      toast.error(readableError(error, 'Could not auto-assign horses'));
    },
  });
}

export function useApplySavedLocationStables(options?: { onSuccess?: () => void }) {
  const router = useRouter();
  return useMutation({
    mutationFn: (input: ApplySavedLocationStablesInput) => applySavedLocationStables(input),
    onSuccess: () => {
      toast.success('Stables added');
      router.refresh();
      options?.onSuccess?.();
    },
    onError: (error) => {
      toast.error(readableError(error, 'Could not add those stables'));
    },
  });
}
