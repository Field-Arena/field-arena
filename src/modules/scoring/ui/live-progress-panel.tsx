'use client';

import { useState } from 'react';
import { GhostButton } from '@/shared/ui/organizer/buttons';
import { scoreLabel, sheetPct } from '../scoring-engine';
import { toSheet } from '../utils';
import {
  useCorrectEntry,
  useDisqualifyRide,
  useReopenScoresheet,
  useScratchRide,
  useSkipRide,
} from '../hooks/use-scoring-mutations';
import { ReasonModal } from './reason-modal';
import type { PanelSeat, RideEntry, ScoreRow, TestDefinition } from '../types';

type RowActionTarget = { entryId: string; kind: 'correct' | 'disqualify' | 'reopen'; seatId?: string } | null;

/**
 * Admin's every-ride grid, ported from showrunner-scoring.html's
 * `liveProgressTable()`: one row per entry, one column per panel seat's
 * sheet state, and row actions that vary by whether the ride is already
 * confirmed (Correct/Reopen) or not (Skip/Scratch/Disqualify) — operating
 * on any row, not just the current ride.
 */
export function LiveProgressPanel({
  classId,
  entries,
  panel,
  scores,
  test,
  currentEntryId,
}: {
  classId: string;
  entries: RideEntry[];
  panel: PanelSeat[];
  scores: ScoreRow[];
  test: TestDefinition | null;
  currentEntryId: string | null;
}) {
  const [target, setTarget] = useState<RowActionTarget>(null);

  const skip = useSkipRide();
  const scratch = useScratchRide();
  const disqualify = useDisqualifyRide();
  const correct = useCorrectEntry();
  const reopen = useReopenScoresheet();

  if (entries.length === 0) return null;

  return (
    <div className="mb-6 overflow-x-auto rounded-xl border border-[#E9EDEB] bg-white p-[16px_18px]">
      <span className="mb-1 block text-[10px] font-bold tracking-[.12em] text-[#7A8781] uppercase">
        Live Progress
      </span>
      <p className="mb-3 text-[13px] text-[#7A8781]">
        Every ride in the class, and where each judge stands on it. Correct a confirmed score, or
        scratch/skip/disqualify a rider who hasn&apos;t gone yet.
      </p>

      <table className="w-full min-w-[720px] border-collapse text-[13px]">
        <thead>
          <tr className="text-left text-[11px] tracking-[.08em] text-[#7A8781] uppercase">
            <th className="p-2">Draw</th>
            <th className="p-2">Rider</th>
            <th className="p-2">Horse</th>
            {panel.map((seat) => (
              <th key={seat.seatId} className="p-2">
                {seat.position ?? seat.seatId}
              </th>
            ))}
            <th className="p-2 text-right">Final</th>
            <th className="p-2">Status</th>
            <th className="p-2"></th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const status = entry.advancedPast
              ? 'Confirmed'
              : entry.id === currentEntryId
                ? 'In ring'
                : 'Upcoming';

            return (
              <tr key={entry.id} className="border-t border-[#E9EDEB] align-top">
                <td className="p-2">{entry.draw ?? '—'}</td>
                <td className="p-2 font-semibold text-ink-deep">{entry.rider ?? '—'}</td>
                <td className="p-2">{entry.horse ?? '—'}</td>
                {panel.map((seat) => {
                  const score = scores.find((s) => s.entryId === entry.id && s.seatId === seat.seatId);
                  if (!score) {
                    return (
                      <td key={seat.seatId} className="p-2 text-[#B4BFB9]">
                        —
                      </td>
                    );
                  }
                  if (!score.submitted) {
                    return (
                      <td key={seat.seatId} className="p-2 text-[#7A8781]">
                        …
                      </td>
                    );
                  }
                  const pct = test ? sheetPct(toSheet(score), test) : null;
                  return (
                    <td key={seat.seatId} className="p-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-semibold text-ink-deep">
                          {pct !== null ? scoreLabel(pct) : '—'}
                        </span>
                        {!entry.advancedPast && (
                          <button
                            type="button"
                            className="text-[11px] font-semibold text-[#5A6B63] underline hover:text-gold"
                            onClick={() => {
                              setTarget({ entryId: entry.id, kind: 'reopen', seatId: seat.seatId });
                            }}
                          >
                            Reopen
                          </button>
                        )}
                      </div>
                    </td>
                  );
                })}
                <td className="p-2 text-right font-mono font-semibold text-ink-deep">
                  {entry.finalPct ?? '—'}
                </td>
                <td className="p-2">{status}</td>
                <td className="p-2">
                  {entry.advancedPast ? (
                    <GhostButton
                      type="button"
                      onClick={() => {
                        setTarget({ entryId: entry.id, kind: 'correct' });
                      }}
                    >
                      Correct
                    </GhostButton>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      <GhostButton
                        type="button"
                        disabled={skip.isPending}
                        onClick={() => {
                          skip.mutate({ classId, entryId: entry.id });
                        }}
                      >
                        Skip
                      </GhostButton>
                      <GhostButton
                        type="button"
                        disabled={scratch.isPending}
                        onClick={() => {
                          if (
                            !window.confirm(
                              `Scratch #${entry.num}? They'll stay on the running order, marked as scratched.`
                            )
                          )
                            return;
                          scratch.mutate({ classId, entryId: entry.id });
                        }}
                      >
                        Scratch
                      </GhostButton>
                      <GhostButton
                        type="button"
                        className="border-[#E3B8B8] text-[#B23A3A] hover:border-[#B23A3A]"
                        onClick={() => {
                          setTarget({ entryId: entry.id, kind: 'disqualify' });
                        }}
                      >
                        Disqualify
                      </GhostButton>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <ReasonModal
        open={target?.kind === 'correct'}
        onOpenChange={(open) => {
          if (!open) setTarget(null);
        }}
        title="Correct this ride"
        description="A post-hoc note on an already-confirmed score, shown to the organizer."
        required={false}
        isPending={correct.isPending}
        onConfirm={(note) => {
          if (!target) return;
          correct.mutate(
            { classId, entryId: target.entryId, note },
            { onSuccess: () => { setTarget(null); } }
          );
        }}
      />

      <ReasonModal
        open={target?.kind === 'disqualify'}
        onOpenChange={(open) => {
          if (!open) setTarget(null);
        }}
        title="Disqualify this ride"
        description="A reason is required — it's shown to the organizer."
        required
        isPending={disqualify.isPending}
        onConfirm={(reason) => {
          if (!target) return;
          disqualify.mutate(
            { classId, entryId: target.entryId, reason },
            { onSuccess: () => { setTarget(null); } }
          );
        }}
      />

      <ReasonModal
        open={target?.kind === 'reopen'}
        onOpenChange={(open) => {
          if (!open) setTarget(null);
        }}
        title="Reopen this scoresheet"
        description="A reason is required — it's shown to the organizer."
        required
        isPending={reopen.isPending}
        onConfirm={(reason) => {
          if (!target?.seatId) return;
          reopen.mutate(
            { classId, entryId: target.entryId, seatId: target.seatId, reason },
            { onSuccess: () => { setTarget(null); } }
          );
        }}
      />
    </div>
  );
}
