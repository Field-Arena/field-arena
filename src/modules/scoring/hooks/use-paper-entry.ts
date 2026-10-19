'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { savePaperSheet } from '@/modules/scoring/data/mutations';
import { isSheetComplete, scoreLabel, sheetPct } from '@/modules/scoring/scoring-engine';
import { parsePaperMark } from '@/modules/scoring/utils/parse-paper-mark';
import { computeRideResult } from '@/modules/scoring/utils/compute-ride-result';
import { parseFinalPct } from '@/modules/scoring/utils/parse-final-pct';
import type { SavePaperSheetInput } from '@/modules/scoring/schemas';
import type { ScoreRow, Sheet, TestDefinition } from '@/modules/scoring/types';

export function useSavePaperSheet() {
  return useMutation({
    mutationFn: (input: SavePaperSheetInput) => savePaperSheet(input),
    onSuccess: (result) => {
      toast.success(`Sheet saved — ${scoreLabel(parseFinalPct(result.finalPct))}`);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Could not save this sheet.');
    },
  });
}

interface SeatDraft {
  movements: Record<string, string>;
  collectives: Record<string, string>;
  errors: number;
}

export interface PaperSeat {
  seatId: string;
  judgeName: string;
}

function draftFromScore(score: ScoreRow | undefined): SeatDraft {
  const fmt = (marks: ScoreRow['movements']) =>
    Object.fromEntries(
      Object.entries(marks).map(([key, mark]) => [
        key,
        mark.value === null ? '' : String(mark.value),
      ]),
    );
  // Only a sheet that was itself typed in from paper is offered for
  // correction; live marks are never copied into a paper sheet.
  if (!score?.enteredFromPaper) return { movements: {}, collectives: {}, errors: 0 };
  return {
    movements: fmt(score.movements),
    collectives: fmt(score.collectives),
    errors: score.errors,
  };
}

/** The sheets being typed in for one ride: the raw text of every box, what
 * each one parses to, and the live percentage — so the office can check the
 * total against the paper before saving. Mount it keyed by the ride so
 * switching rides starts fresh. */
export function usePaperSheetForm({
  classId,
  entryId,
  test,
  seats,
  scores,
}: {
  classId: string;
  entryId: string;
  test: TestDefinition;
  seats: readonly PaperSeat[];
  scores: readonly ScoreRow[];
}) {
  const [drafts, setDrafts] = useState<Record<string, SeatDraft>>(() =>
    Object.fromEntries(
      seats.map((seat) => [
        seat.seatId,
        draftFromScore(scores.find((s) => s.entryId === entryId && s.seatId === seat.seatId)),
      ]),
    ),
  );

  function update(seatId: string, change: (draft: SeatDraft) => SeatDraft) {
    setDrafts((prev) => {
      const current = prev[seatId] ?? { movements: {}, collectives: {}, errors: 0 };
      return { ...prev, [seatId]: change(current) };
    });
  }

  const perSeat = seats.map((seat) => {
    const draft = drafts[seat.seatId] ?? { movements: {}, collectives: {}, errors: 0 };
    const invalid = new Set<string>();
    const sheet: Sheet = {
      movements: {},
      collectives: {},
      errors: draft.errors,
      remarks: {},
      finalRemarks: '',
      submitted: false,
    };
    for (const m of test.movements) {
      const key = String(m.num);
      const parsed = parsePaperMark(draft.movements[key] ?? '');
      if (parsed === 'invalid') invalid.add(`m:${key}`);
      sheet.movements[key] = parsed === 'invalid' ? null : parsed;
    }
    for (const c of test.collectives) {
      const parsed = parsePaperMark(draft.collectives[c.key] ?? '');
      if (parsed === 'invalid') invalid.add(`c:${c.key}`);
      sheet.collectives[c.key] = parsed === 'invalid' ? null : parsed;
    }
    const complete = invalid.size === 0 && isSheetComplete(sheet, test);
    return {
      seat,
      draft,
      sheet,
      invalid,
      complete,
      pctLabel: complete ? scoreLabel(sheetPct(sheet, test)) : null,
    };
  });

  const allComplete = perSeat.every((s) => s.complete);
  const finalLabel = allComplete
    ? scoreLabel(
        parseFinalPct(
          computeRideResult(
            perSeat.map((s) => ({ seatId: s.seat.seatId, sheet: s.sheet })),
            test,
          ).finalPct,
        ),
      )
    : null;

  function toInput(): SavePaperSheetInput {
    const marks = (values: Record<string, number | null>) =>
      Object.fromEntries(
        Object.entries(values).filter((entry): entry is [string, number] => entry[1] !== null),
      );
    return {
      classId,
      entryId,
      sheets: perSeat.map((s) => ({
        seatId: s.seat.seatId,
        movements: marks(s.sheet.movements),
        collectives: marks(s.sheet.collectives),
        errors: s.sheet.errors,
      })),
    };
  }

  return {
    perSeat,
    allComplete,
    finalLabel,
    toInput,
    setMovement: (seatId: string, num: string, text: string) => {
      update(seatId, (d) => ({ ...d, movements: { ...d.movements, [num]: text } }));
    },
    setCollective: (seatId: string, key: string, text: string) => {
      update(seatId, (d) => ({ ...d, collectives: { ...d.collectives, [key]: text } }));
    },
    setErrors: (seatId: string, errors: number) => {
      update(seatId, (d) => ({ ...d, errors }));
    },
  };
}
