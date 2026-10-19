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
  startRide,
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
import { scoringWriteKey } from '@/modules/scoring/hooks/use-unsaved-writes';
import { ScoringWriteError, sendScoringWrite } from '@/modules/scoring/hooks/send-scoring-write';
import type {
  PublishResultsInput,
  SetCollectiveInput,
  SetFinalRemarksInput,
  SetMarkInput,
  SetRemarkInput,
  ToggleErrorAtInput,
} from '@/modules/scoring/schemas';
import type { PublishResultsOutcome } from '@/modules/scoring/types';

function queued<Input, Output>(action: (input: Input) => Promise<Output>) {
  return (input: Input) => enqueueScoringWrite(() => action(input));
}

const SYNC_FAILURE_TOAST_ID = 'scoring-sync-failure';

function markWriteOptions() {
  return {
    retry: false,
    onError: (error: unknown) => {
      if (error instanceof ScoringWriteError && error.reason !== 'transient') {
        // The judge needs to see why; the next poll restores the saved value.
        toast.error(error.message);
        return;
      }
      toast.error(
        "Connection problem — some marks aren't saved yet. They're marked on the sheet and will keep retrying; you can't sign until they're saved.",
        { id: SYNC_FAILURE_TOAST_ID, duration: Infinity },
      );
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
  return useMutation({
    mutationFn: (input: SetMarkInput) =>
      sendScoringWrite(
        scoringWriteKey(input.entryId, input.seatId, 'movements', String(input.movementNum)),
        () => setMark(input),
      ),
    ...markWriteOptions(),
  });
}

export function useSetCollective() {
  return useMutation({
    mutationFn: (input: SetCollectiveInput) =>
      sendScoringWrite(scoringWriteKey(input.entryId, input.seatId, 'collectives', input.key), () =>
        setCollective(input),
      ),
    ...markWriteOptions(),
  });
}

export function useSetRemark() {
  return useMutation({
    mutationFn: (input: SetRemarkInput) =>
      sendScoringWrite(
        scoringWriteKey(input.entryId, input.seatId, 'remarks', String(input.movementNum)),
        () => setRemark(input),
      ),
    ...markWriteOptions(),
  });
}

export function useSetFinalRemarks() {
  return useMutation({
    mutationFn: (input: SetFinalRemarksInput) =>
      sendScoringWrite(scoringWriteKey(input.entryId, input.seatId, 'final_remarks', 'final'), () =>
        setFinalRemarks(input),
      ),
    ...markWriteOptions(),
  });
}

export function useToggleErrorAt() {
  return useMutation({
    mutationFn: (input: ToggleErrorAtInput) =>
      sendScoringWrite(
        scoringWriteKey(input.entryId, input.seatId, 'error_at', String(input.movementNum)),
        () => toggleErrorAt(input),
      ),
    ...markWriteOptions(),
  });
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

async function publishWithConfirm(input: PublishResultsInput) {
  const outcome = await publishResults(input);
  if (outcome.published) return outcome;
  const confirmed = window.confirm(
    `${String(outcome.incomplete)} ride${outcome.incomplete === 1 ? " isn't" : "s aren't"} fully scored and signed yet. Publish results anyway?`,
  );
  if (!confirmed) return outcome;
  return publishResults({ ...input, force: true });
}

export function usePublishResults() {
  return useMutation({
    mutationFn: queued(publishWithConfirm),
    ...toastedMutationOptions('Could not publish'),
    onSuccess: (outcome: PublishResultsOutcome) => {
      if (outcome.published) toast.success('Results published');
    },
  });
}

export function useStartRide() {
  return useMutation({ mutationFn: queued(startRide), retry: false });
}

export function useUnpublishResults() {
  return useMutation({
    mutationFn: queued(unpublishResults),
    ...toastedMutationOptions('Could not unpublish'),
    onSuccess: () => toast.success('Results unpublished'),
  });
}
