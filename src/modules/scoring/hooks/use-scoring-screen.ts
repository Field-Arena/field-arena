'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { AUTO_ADVANCE_GRACE_MS, UNDO_WINDOW_MS } from '@/modules/scoring/constants';
import { useAdvanceRide } from '@/modules/scoring/hooks/use-scoring-mutations';
import type { TestSheetHandle } from '@/modules/scoring/ui/test-sheet';
import type { ClassScoringState, MySeat, ScoreRow } from '@/modules/scoring/types';

export type LastUndo = { entryId: string; kind: 'skip' | 'terminal' } | null;

export function blankScore(): Omit<
  ScoreRow,
  'id' | 'entryId' | 'seatId' | 'signedBy' | 'signedAt' | 'updatedAt'
> {
  return {
    movements: {},
    collectives: {},
    errors: 0,
    errorAt: {},
    remarks: {},
    finalRemarks: '',
    submitted: false,
  };
}

export function useScoringScreen({
  classId,
  state,
  mySeat,
  refetch,
  applyOptimistic,
}: {
  classId: string;
  state: ClassScoringState;
  mySeat: MySeat | null;
  refetch: () => Promise<unknown>;
  applyOptimistic: (updater: (prev: ClassScoringState) => ClassScoringState) => void;
}) {
  const currentEntry = useMemo(() => {
    if (state.classState.workingInEntryId) {
      return (
        state.entries.find((e) => e.id === state.classState.workingInEntryId) ??
        state.holdingEntries.find((e) => e.id === state.classState.workingInEntryId) ??
        null
      );
    }
    return state.entries[state.classState.pos] ?? null;
  }, [state]);

  const test = currentEntry?.testOverride ?? state.test;
  const myScore = currentEntry
    ? state.scores.find((s) => s.entryId === currentEntry.id && s.seatId === mySeat?.seatId)
    : undefined;

  const sheetHandleRef = useRef<TestSheetHandle>(null);
  const [signatureOpen, setSignatureOpen] = useState(false);
  const [reasonModal, setReasonModal] = useState<'disqualify' | null>(null);
  const [lastUndo, setLastUndo] = useState<LastUndo>(null);
  const [autoAdvanceCancelled, setAutoAdvanceCancelled] = useState(false);

  const [lastEntryId, setLastEntryId] = useState(currentEntry?.id);
  if (currentEntry?.id !== lastEntryId) {
    setLastEntryId(currentEntry?.id);
    setAutoAdvanceCancelled(false);
  }

  const advance = useAdvanceRide();

  useEffect(() => {
    if (!lastUndo) return;
    const id = setTimeout(() => {
      setLastUndo(null);
    }, UNDO_WINDOW_MS);
    return () => {
      clearTimeout(id);
    };
  }, [lastUndo]);

  const allSeatsReady = Boolean(
    currentEntry &&
    state.panel.every(
      (seat) =>
        state.scores.find((s) => s.entryId === currentEntry.id && s.seatId === seat.seatId)
          ?.submitted,
    ),
  );

  useEffect(() => {
    if (!allSeatsReady || autoAdvanceCancelled || !currentEntry) return;
    const id = setTimeout(() => {
      advance.mutate(
        { classId, entryId: currentEntry.id },
        {
          onSuccess: () => {
            void refetch();
          },
          onError: (error) => {
            toast.error(error instanceof Error ? error.message : 'Could not advance');
          },
        },
      );
    }, AUTO_ADVANCE_GRACE_MS);
    return () => {
      clearTimeout(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allSeatsReady, autoAdvanceCancelled, currentEntry?.id]);

  function afterAction() {
    void refetch();
  }

  function updateMyScore(updater: (score: ScoreRow) => ScoreRow) {
    if (!mySeat || !currentEntry) return;
    applyOptimistic((prev) => {
      const existing = prev.scores.find(
        (s) => s.entryId === currentEntry.id && s.seatId === mySeat.seatId,
      );
      const idx = existing ? prev.scores.indexOf(existing) : -1;
      const base: ScoreRow = existing ?? {
        id: `optimistic-${currentEntry.id}-${mySeat.seatId}`,
        entryId: currentEntry.id,
        seatId: mySeat.seatId,
        signedBy: null,
        signedAt: null,
        updatedAt: new Date(0).toISOString(),
        ...blankScore(),
      };
      const updated = updater(base);
      const scores =
        idx >= 0 ? prev.scores.map((s, i) => (i === idx ? updated : s)) : [...prev.scores, updated];
      return { ...prev, scores };
    });
  }

  return {
    currentEntry,
    test,
    myScore,
    sheetHandleRef,
    signatureOpen,
    setSignatureOpen,
    reasonModal,
    setReasonModal,
    lastUndo,
    setLastUndo,
    autoAdvanceCancelled,
    setAutoAdvanceCancelled,
    allSeatsReady,
    afterAction,
    updateMyScore,
  };
}
