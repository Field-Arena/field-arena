'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  addHoldingEntry,
  advanceRide,
  correctEntry,
  disqualifyRide,
  publishResults,
  removeHoldingEntry,
  removePanelSeat,
  reopenScoresheet,
  scratchRide,
  setCollective,
  setFinalRemarks,
  setMark,
  setRemark,
  skipRide,
  submitScoresheet,
  toggleErrorAt,
  toggleScoringOpen,
  unfinishRide,
  unpublishResults,
  unskipRide,
  upsertPanelSeat,
  workInEntry,
} from '@/modules/scoring/data/mutations';
import { enqueueScoringWrite } from '@/modules/scoring/hooks/use-mutation-queue';
import { MAX_WRITE_RETRIES, WRITE_RETRY_MS } from '@/modules/scoring/constants';

function queued<Input, Output>(action: (input: Input) => Promise<Output>) {
  return (input: Input) => enqueueScoringWrite(() => action(input));
}

function isNetworkFailure(error: unknown): boolean {
  return error instanceof TypeError && /fetch|network/i.test(error.message);
}

const SYNC_FAILURE_TOAST_ID = 'scoring-sync-failure';

function silentMutationOptions() {
  return {
    retry: (failureCount: number, error: unknown) =>
      failureCount < MAX_WRITE_RETRIES && isNetworkFailure(error),
    retryDelay: WRITE_RETRY_MS,
    onError: () => {
      toast.error("Not synced — a mark didn't save. Check your connection and try again.", {
        id: SYNC_FAILURE_TOAST_ID,
        duration: Infinity,
      });
    },
    onSuccess: () => {
      toast.dismiss(SYNC_FAILURE_TOAST_ID);
    },
  };
}

function toastedMutationOptions(errorMessage: string) {
  return {
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : errorMessage);
    },
  };
}

export function useSetMark() {
  return useMutation({ mutationFn: queued(setMark), ...silentMutationOptions() });
}

export function useSetCollective() {
  return useMutation({ mutationFn: queued(setCollective), ...silentMutationOptions() });
}

export function useSetRemark() {
  return useMutation({ mutationFn: queued(setRemark), ...silentMutationOptions() });
}

export function useSetFinalRemarks() {
  return useMutation({ mutationFn: queued(setFinalRemarks), ...silentMutationOptions() });
}

export function useToggleErrorAt() {
  return useMutation({ mutationFn: queued(toggleErrorAt), ...silentMutationOptions() });
}

export function useSubmitScoresheet() {
  return useMutation({
    mutationFn: queued(submitScoresheet),
    ...toastedMutationOptions('Could not submit'),
    onSuccess: () => toast.success('Signed and submitted'),
  });
}

export function useReopenScoresheet() {
  return useMutation({
    mutationFn: queued(reopenScoresheet),
    ...toastedMutationOptions('Could not reopen'),
    onSuccess: () => toast.success('Scoresheet reopened'),
  });
}

export function useCorrectEntry() {
  return useMutation({
    mutationFn: queued(correctEntry),
    ...toastedMutationOptions('Could not save the correction'),
    onSuccess: () => toast.success('Note saved'),
  });
}

export function useAdvanceRide() {
  return useMutation({
    mutationFn: queued(advanceRide),
    ...toastedMutationOptions('Could not advance'),
  });
}

export function useScratchRide() {
  return useMutation({
    mutationFn: queued(scratchRide),
    ...toastedMutationOptions('Could not scratch'),
    onSuccess: () => toast.success('Scratched'),
  });
}

export function useDisqualifyRide() {
  return useMutation({
    mutationFn: queued(disqualifyRide),
    ...toastedMutationOptions('Could not disqualify'),
    onSuccess: () => toast.success('Disqualified'),
  });
}

export function useSkipRide() {
  return useMutation({
    mutationFn: queued(skipRide),
    ...toastedMutationOptions('Could not skip'),
    onSuccess: () => toast.success('Skipped'),
  });
}

export function useUnskipRide() {
  return useMutation({
    mutationFn: queued(unskipRide),
    ...toastedMutationOptions('Could not undo'),
    onSuccess: () => toast.success('Undone'),
  });
}

export function useUnfinishRide() {
  return useMutation({
    mutationFn: queued(unfinishRide),
    ...toastedMutationOptions('Could not undo'),
    onSuccess: () => toast.success('Undone'),
  });
}

export function useAddHoldingEntry() {
  return useMutation({
    mutationFn: queued(addHoldingEntry),
    ...toastedMutationOptions('Could not add to the holding queue'),
    onSuccess: () => toast.success('Added to the holding queue'),
  });
}

export function useRemoveHoldingEntry() {
  return useMutation({
    mutationFn: queued(removeHoldingEntry),
    ...toastedMutationOptions('Could not remove'),
  });
}

export function useUpsertPanelSeat() {
  return useMutation({
    mutationFn: queued(upsertPanelSeat),
    ...toastedMutationOptions('Could not update the panel'),
  });
}

export function useRemovePanelSeat() {
  return useMutation({
    mutationFn: queued(removePanelSeat),
    ...toastedMutationOptions('Could not remove that seat'),
  });
}

export function useWorkInEntry() {
  return useMutation({
    mutationFn: queued(workInEntry),
    ...toastedMutationOptions('Could not work this rider in'),
  });
}

export function useToggleScoringOpen() {
  return useMutation({
    mutationFn: queued(toggleScoringOpen),
    ...toastedMutationOptions('Could not change scoring status'),
  });
}

export function usePublishResults() {
  return useMutation({
    mutationFn: queued(publishResults),
    ...toastedMutationOptions('Could not publish'),
    onSuccess: () => toast.success('Results published'),
  });
}

export function useUnpublishResults() {
  return useMutation({
    mutationFn: queued(unpublishResults),
    ...toastedMutationOptions('Could not unpublish'),
    onSuccess: () => toast.success('Results unpublished'),
  });
}
