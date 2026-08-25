'use client';

import { Fragment, useState } from 'react';
import { GhostButton } from '@/shared/ui/organizer/buttons';
import { Button } from '@/shared/ui/shadcn/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/shadcn/table';
import { scoreLabel, sheetPct } from '@/modules/scoring/scoring-engine';
import { toSheet } from '@/modules/scoring/utils/to-sheet';
import {
  useCorrectEntry,
  useDisqualifyRide,
  useReopenScoresheet,
  useScratchRide,
  useSkipRide,
} from '@/modules/scoring/hooks/use-scoring-mutations';
import { ReasonModal } from '@/modules/scoring/ui/reason-modal';
import type { PanelSeat, RideEntry, ScoreRow, TestDefinition } from '@/modules/scoring/types';

type RowActionTarget = {
  entryId: string;
  kind: 'correct' | 'disqualify' | 'reopen';
  seatId?: string;
} | null;

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

      <Table className="w-full min-w-[720px] border-collapse text-[13px]">
        <TableHeader className="[&_tr]:border-0">
          <TableRow className="text-left text-[11px] tracking-[.08em] text-[#7A8781] uppercase hover:bg-transparent">
            <TableHead className="h-auto p-2 text-left text-[11px] font-normal tracking-[.08em] text-[#7A8781] uppercase">
              Draw
            </TableHead>
            <TableHead className="h-auto p-2 text-left text-[11px] font-normal tracking-[.08em] text-[#7A8781] uppercase">
              Rider
            </TableHead>
            <TableHead className="h-auto p-2 text-left text-[11px] font-normal tracking-[.08em] text-[#7A8781] uppercase">
              Horse
            </TableHead>
            {panel.map((seat) => (
              <TableHead
                key={seat.seatId}
                className="h-auto p-2 text-left text-[11px] font-normal tracking-[.08em] text-[#7A8781] uppercase"
              >
                {seat.position ?? seat.seatId}
              </TableHead>
            ))}
            <TableHead className="h-auto p-2 text-right text-[11px] font-normal tracking-[.08em] text-[#7A8781] uppercase">
              Final
            </TableHead>
            <TableHead className="h-auto p-2 text-left text-[11px] font-normal tracking-[.08em] text-[#7A8781] uppercase">
              Status
            </TableHead>
            <TableHead className="h-auto p-2"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="[&_tr:last-child]:border-t [&_tr:last-child]:border-[#E9EDEB]">
          {entries.map((entry) => {
            const status = entry.advancedPast
              ? 'Confirmed'
              : entry.id === currentEntryId
                ? 'In ring'
                : 'Upcoming';

            const noteColSpan = panel.length + 4;

            return (
              <Fragment key={entry.id}>
                <TableRow className="border-t border-b-0 border-[#E9EDEB] align-top hover:bg-transparent">
                  <TableCell className="p-2 align-top whitespace-normal">
                    {entry.draw ?? '—'}
                  </TableCell>
                  <TableCell className="text-ink-deep p-2 align-top font-semibold whitespace-normal">
                    {entry.rider ?? '—'}
                  </TableCell>
                  <TableCell className="p-2 align-top whitespace-normal">
                    {entry.horse ?? '—'}
                  </TableCell>
                  {panel.map((seat) => {
                    const score = scores.find(
                      (s) => s.entryId === entry.id && s.seatId === seat.seatId,
                    );
                    if (!score) {
                      return (
                        <TableCell
                          key={seat.seatId}
                          className="p-2 align-top whitespace-normal text-[#B4BFB9]"
                        >
                          —
                        </TableCell>
                      );
                    }
                    if (!score.submitted) {
                      return (
                        <TableCell
                          key={seat.seatId}
                          className="p-2 align-top whitespace-normal text-[#7A8781]"
                        >
                          …
                        </TableCell>
                      );
                    }
                    const pct = test ? sheetPct(toSheet(score), test) : null;
                    return (
                      <TableCell key={seat.seatId} className="p-2 align-top whitespace-normal">
                        <div className="flex items-center gap-1.5">
                          <span className="text-ink-deep font-mono font-semibold">
                            {pct !== null ? scoreLabel(pct) : '—'}
                          </span>
                          {!entry.advancedPast && (
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => {
                                setTarget({
                                  entryId: entry.id,
                                  kind: 'reopen',
                                  seatId: seat.seatId,
                                });
                              }}
                              className="hover:text-gold h-auto rounded-none px-0 py-0 text-[11px] font-semibold text-[#5A6B63] underline hover:bg-transparent"
                            >
                              Reopen
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    );
                  })}
                  <TableCell className="text-ink-deep p-2 text-right align-top font-mono font-semibold whitespace-normal">
                    {entry.finalPct ?? '—'}
                  </TableCell>
                  <TableCell className="p-2 align-top whitespace-normal">{status}</TableCell>
                  <TableCell className="p-2 align-top whitespace-normal">
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
                                `Scratch #${entry.num}? They'll stay on the running order, marked as scratched.`,
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
                  </TableCell>
                </TableRow>
                {entry.correction && (
                  <TableRow className="border-t border-b-0 border-[#E9EDEB] hover:bg-transparent">
                    <TableCell className="p-2 whitespace-normal"></TableCell>
                    <TableCell
                      className="p-2 text-[12px] whitespace-normal text-[#7A8781]"
                      colSpan={noteColSpan}
                    >
                      Corrected · {entry.correction}
                    </TableCell>
                  </TableRow>
                )}
                {entry.reason && (
                  <TableRow className="border-t border-b-0 border-[#E9EDEB] hover:bg-transparent">
                    <TableCell className="p-2 whitespace-normal"></TableCell>
                    <TableCell
                      className="p-2 text-[12px] whitespace-normal text-[#7A8781]"
                      colSpan={noteColSpan}
                    >
                      Eliminated · {entry.reason}
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            );
          })}
        </TableBody>
      </Table>

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
            {
              onSuccess: () => {
                setTarget(null);
              },
            },
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
            {
              onSuccess: () => {
                setTarget(null);
              },
            },
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
            {
              onSuccess: () => {
                setTarget(null);
              },
            },
          );
        }}
      />
    </div>
  );
}
