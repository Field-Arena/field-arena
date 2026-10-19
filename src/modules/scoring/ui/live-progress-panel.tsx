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
import { resolveEffectiveTest } from '@/modules/scoring/utils/resolve-effective-test';
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

  const currentIndex = entries.findIndex((e) => e.id === currentEntryId);
  const upNextId =
    entries.find((e, i) => i > currentIndex && !e.advancedPast && e.status === 'scheduled')?.id ??
    null;

  return (
    <div className="fa-card mb-6">
      <div className="fa-card-head">
        <div>
          <h3>Ride order</h3>
          <div className="fa-sub">
            Every ride in the class and where each judge stands on it — marks post live as each
            rider is confirmed. Correct a confirmed score, or skip / scratch / disqualify a rider
            who hasn&apos;t gone yet.
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table className="w-full min-w-[720px] border-collapse text-[13px]">
          <TableHeader className="[&_tr]:border-0">
            <TableRow className="text-left text-[11px] tracking-[.08em] text-[#8A94A3] uppercase hover:bg-transparent">
              <TableHead className="h-auto px-3 py-2.5 text-left text-[11px] font-normal tracking-[.08em] text-[#8A94A3] uppercase">
                Draw
              </TableHead>
              <TableHead className="h-auto px-3 py-2.5 text-left text-[11px] font-normal tracking-[.08em] text-[#8A94A3] uppercase">
                Rider
              </TableHead>
              <TableHead className="h-auto px-3 py-2.5 text-left text-[11px] font-normal tracking-[.08em] text-[#8A94A3] uppercase">
                Horse
              </TableHead>
              {panel.map((seat) => (
                <TableHead
                  key={seat.seatId}
                  className="h-auto px-3 py-2.5 text-left text-[11px] font-normal tracking-[.08em] text-[#8A94A3] uppercase"
                >
                  {seat.position ?? seat.seatId}
                </TableHead>
              ))}
              <TableHead className="h-auto px-3 py-2.5 text-right text-[11px] font-normal tracking-[.08em] text-[#8A94A3] uppercase">
                Final
              </TableHead>
              <TableHead className="h-auto px-3 py-2.5 text-left text-[11px] font-normal tracking-[.08em] text-[#8A94A3] uppercase">
                Status
              </TableHead>
              <TableHead className="h-auto px-3 py-2.5"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="[&_tr:last-child]:border-t [&_tr:last-child]:border-[#E7EAEE]">
            {entries.map((entry) => {
              const status =
                entry.status === 'scratched'
                  ? { label: 'Scratched', badge: 'fa-stub' }
                  : entry.status === 'disqualified'
                    ? { label: 'Disqualified', badge: 'fa-red' }
                    : entry.advancedPast
                      ? { label: 'Confirmed', badge: 'fa-live' }
                      : entry.id === currentEntryId
                        ? { label: 'Scoring now', badge: 'fa-pending' }
                        : entry.id === upNextId
                          ? { label: 'Up next', badge: 'fa-pass' }
                          : { label: 'Waiting', badge: 'fa-stub' };

              const noteColSpan = panel.length + 4;

              return (
                <Fragment key={entry.id}>
                  <TableRow
                    className={`border-t border-b-0 border-[var(--fa-line-soft)] align-top ${entry.id === currentEntryId ? 'bg-[#FFFBF2]' : ''}`}
                  >
                    <TableCell className="px-3 py-2.5 align-top whitespace-normal">
                      {entry.draw ?? '—'}
                    </TableCell>
                    <TableCell className="px-3 py-2.5 align-top font-semibold whitespace-normal text-[#101828]">
                      {entry.rider ?? '—'}
                    </TableCell>
                    <TableCell className="px-3 py-2.5 align-top whitespace-normal">
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
                            className="px-3 py-2.5 align-top whitespace-normal text-[#B4BFB9]"
                          >
                            —
                          </TableCell>
                        );
                      }
                      if (!score.submitted) {
                        return (
                          <TableCell
                            key={seat.seatId}
                            className="px-3 py-2.5 align-top whitespace-normal text-[#8A94A3]"
                          >
                            …
                          </TableCell>
                        );
                      }
                      const entryTest = resolveEffectiveTest(entry.testOverride, test);
                      const pct = entryTest ? sheetPct(toSheet(score), entryTest) : null;
                      return (
                        <TableCell
                          key={seat.seatId}
                          className="px-3 py-2.5 align-top whitespace-normal"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-[#101828] tabular-nums">
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
                                className="h-auto rounded-none px-0 py-0 text-[11px] font-semibold text-[#475467] underline hover:bg-transparent hover:text-[#B45309]"
                              >
                                Reopen
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      );
                    })}
                    <TableCell className="px-3 py-2.5 text-right align-top font-semibold whitespace-normal text-[#101828] tabular-nums">
                      {entry.finalPct ?? '—'}
                    </TableCell>
                    <TableCell className="px-3 py-2.5 align-top whitespace-normal">
                      <span className={`fa-badge ${status.badge}`}>
                        <span className="fa-dot" />
                        {status.label}
                      </span>
                    </TableCell>
                    <TableCell className="px-3 py-2.5 align-top whitespace-normal">
                      {entry.advancedPast ? (
                        <GhostButton
                          className="!px-2.5 !py-1 !text-[12px]"
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
                            className="!px-2.5 !py-1 !text-[12px]"
                            type="button"
                            disabled={skip.isPending}
                            onClick={() => {
                              skip.mutate({ classId, entryId: entry.id });
                            }}
                          >
                            Skip
                          </GhostButton>
                          <GhostButton
                            className="!px-2.5 !py-1 !text-[12px]"
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
                            className="!border-[#FBCFC9] !px-2.5 !py-1 !text-[12px] !text-[var(--fa-red)] hover:!bg-[var(--fa-red-tint)]"
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
                    <TableRow className="border-t border-b-0 border-[#E7EAEE] hover:bg-transparent">
                      <TableCell className="px-3 py-2.5 whitespace-normal"></TableCell>
                      <TableCell
                        className="px-3 py-2.5 text-[12px] whitespace-normal text-[#8A94A3]"
                        colSpan={noteColSpan}
                      >
                        Corrected · {entry.correction}
                      </TableCell>
                    </TableRow>
                  )}
                  {entry.reason && (
                    <TableRow className="border-t border-b-0 border-[#E7EAEE] hover:bg-transparent">
                      <TableCell className="px-3 py-2.5 whitespace-normal"></TableCell>
                      <TableCell
                        className="px-3 py-2.5 text-[12px] whitespace-normal text-[#8A94A3]"
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
      </div>

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
