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
} from '../data/mutations';
import { enqueueScoringWrite } from './use-mutation-queue';

/** Routes a Server Action through the shared queue — see use-mutation-queue.ts. */
function queued<Input, Output>(action: (input: Input) => Promise<Output>) {
  return (input: Input) => enqueueScoringWrite(() => action(input));
}

/**
 * Marks/collectives retry on genuine network failure (a fetch that never
 * reached the server) — legacy retried those indefinitely with a persistent
 * "not synced" banner. A bounded retry here (3 tries, legacy's own 3s
 * interval) rather than truly indefinite: an unbounded retry loop against a
 * server that is actually rejecting the write (not just unreachable) would
 * hammer it forever with no visible end state. A thrown business error
 * (permission, "judge already entered this mark", validation) is never a
 * network failure and never retried.
 */
function isNetworkFailure(error: unknown): boolean {
  return error instanceof TypeError && /fetch|network/i.test(error.message);
}

const RETRY_DELAY_MS = 3000;

/** One sticky id so repeated failures re-use the same toast instead of stacking — legacy's persistent banner, as a toast. */
const SYNC_FAILURE_TOAST_ID = 'scoring-sync-failure';

/**
 * Marks/collectives/remarks are otherwise silent on error (no per-keystroke
 * toast — that would be noisy). But once retries are exhausted the write is
 * genuinely lost, and legacy never let that happen invisibly: it kept a
 * sticky "not synced" banner up and kept retrying until the write landed.
 * This is the same "don't fail silently" guarantee via a persistent toast
 * (duration Infinity — dismissed only by the next successful write in this
 * class), rather than a bounded auto-hide.
 */
function silentMutationOptions() {
  return {
    retry: (failureCount: number, error: unknown) => failureCount < 3 && isNetworkFailure(error),
    retryDelay: RETRY_DELAY_MS,
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

/** No toast on error — the mark-stepper's own inline "not synced" indicator handles it. */
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
  return useMutation({ mutationFn: queued(advanceRide), ...toastedMutationOptions('Could not advance') });
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
  return useMutation({ mutationFn: queued(removeHoldingEntry), ...toastedMutationOptions('Could not remove') });
}

export function useUpsertPanelSeat() {
  return useMutation({ mutationFn: queued(upsertPanelSeat), ...toastedMutationOptions('Could not update the panel') });
}

export function useRemovePanelSeat() {
  return useMutation({ mutationFn: queued(removePanelSeat), ...toastedMutationOptions('Could not remove that seat') });
}

export function useWorkInEntry() {
  return useMutation({ mutationFn: queued(workInEntry), ...toastedMutationOptions('Could not work this rider in') });
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
