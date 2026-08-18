'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { readableError } from '@/shared/lib/error-message';
import {
  setStableCount,
  updateStableField,
  generateStableStalls,
  renameStall,
  toggleStallClosed,
  toggleStableChartStatus,
  autoAssignStableStalls,
  applySavedLocationStables,
} from '@/modules/shows/data/stable-chart-mutations';
import type {
  SetStableCountInput,
  UpdateStableFieldInput,
  GenerateStableStallsInput,
  RenameStallInput,
  ToggleStallClosedInput,
  ToggleStableChartStatusInput,
  AutoAssignStableStallsInput,
  ApplySavedLocationStablesInput,
} from '@/modules/shows/schemas';

/**
 * Mutation hooks for the Stable Chart screen. Every action revalidates
 * server-side; router.refresh() pulls the re-rendered chart back into this
 * view — same pattern as use-horses-mutations.ts / use-venue-mutations.ts.
 *
 * Frequent, low-stakes edits (resizing the stable count, renaming a field,
 * opening/closing one stall) stay silent on success — only an error toasts —
 * matching useVerifyHorseDocument's cadence. The four more deliberate,
 * one-shot actions (generate/update stalls, publish toggle, auto-assign,
 * apply a saved location) each confirm with a toast, matching
 * useAddManualHorse / useDeleteVenue.
 */

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

export function useToggleStallClosed() {
  const router = useRouter();
  return useMutation({
    mutationFn: (input: ToggleStallClosedInput) => toggleStallClosed(input),
    onSuccess: () => {
      router.refresh();
    },
    onError: (error) => {
      toast.error(readableError(error, 'Could not update this stall'));
    },
  });
}

export function useToggleStableChartStatus() {
  const router = useRouter();
  return useMutation({
    mutationFn: (input: ToggleStableChartStatusInput) => toggleStableChartStatus(input),
    onSuccess: () => {
      toast.success('Saved');
      router.refresh();
    },
    onError: (error) => {
      toast.error(readableError(error, 'Could not update the chart status'));
    },
  });
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
