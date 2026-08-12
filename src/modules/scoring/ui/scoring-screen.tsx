'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Card, ScreenLede, ScreenTitle } from '@/shared/ui/organizer/card';
import { StatusPill } from '@/shared/ui/organizer/status-pill';
import type { PermissionKey } from '@/shared/constants/permissions';
import { AUTO_ADVANCE_GRACE_MS, UNDO_WINDOW_MS } from '../constants';
import { isSheetComplete } from '../scoring-engine';
import { toSheet } from '../utils';
import { useScoringState } from '../hooks/use-scoring-state';
import {
  useAdvanceRide,
  useDisqualifyRide,
  useScratchRide,
  useSetCollective,
  useSetFinalRemarks,
  useSetMark,
  useSetRemark,
  useSkipRide,
  useSubmitScoresheet,
  useToggleErrorAt,
  useToggleScoringOpen,
  useUnfinishRide,
  useUnskipRide,
  usePublishResults,
  useUnpublishResults,
} from '../hooks/use-scoring-mutations';
import { TestSheet, type TestSheetHandle } from './test-sheet';
import { ScoreTally } from './score-tally';
import { ErrorOfCoursePanel } from './error-of-course-panel';
import { PanelStatusStrip } from './panel-status-strip';
import { SignatureModal } from './signature-modal';
import { ReasonModal } from './reason-modal';
import { RideActionsBar } from './ride-actions-bar';
import { HoldingQueuePanel } from './holding-queue-panel';
import { LiveProgressPanel } from './live-progress-panel';
import { PanelAssignmentCard } from './panel-assignment-card';
import type { PanelCandidate } from '../data/queries';
import { StandingsPanel } from './standings-panel';
import { ScoringToolbar } from './scoring-toolbar';
import { NotARealTestBanner } from './not-a-real-test-banner';
import { LiveClockStrip } from './live-clock-strip';
import { PrintScoresheet } from './print-scoresheet';
import type { ClassScoringState, MySeat, ScoreRow } from '../types';

export function ScoringScreen({
  classId,
  initialState,
  mySeat,
  permissions,
  panelCandidates,
}: {
  classId: string;
  initialState: ClassScoringState;
  mySeat: MySeat | null;
  permissions: Record<PermissionKey, boolean>;
  panelCandidates: PanelCandidate[];
}) {
  const { state, refetch, applyOptimistic } = useScoringState(classId, initialState);

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
  const [lastUndo, setLastUndo] = useState<{ entryId: string; kind: 'skip' | 'terminal' } | null>(
    null
  );
  const [autoAdvanceCancelled, setAutoAdvanceCancelled] = useState(false);

  // Reset the auto-advance cancel flag whenever the current ride changes —
  // adjusting state from a prop-derived value during render, not an effect.
  const [lastEntryId, setLastEntryId] = useState(currentEntry?.id);
  if (currentEntry?.id !== lastEntryId) {
    setLastEntryId(currentEntry?.id);
    setAutoAdvanceCancelled(false);
  }

  const setMark = useSetMark();
  const setCollective = useSetCollective();
  const toggleError = useToggleErrorAt();
  const setRemark = useSetRemark();
  const setFinalRemarks = useSetFinalRemarks();
  const submit = useSubmitScoresheet();
  const advance = useAdvanceRide();
  const scratch = useScratchRide();
  const disqualify = useDisqualifyRide();
  const skip = useSkipRide();
  const unskip = useUnskipRide();
  const unfinish = useUnfinishRide();
  const toggleOpen = useToggleScoringOpen();
  const publish = usePublishResults();
  const unpublish = useUnpublishResults();

  // The undo window — 20s after a scratch/disqualify/skip, then it's gone.
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
    currentEntry && state.panel.every((seat) => state.scores.find((s) => s.entryId === currentEntry.id && s.seatId === seat.seatId)?.submitted)
  );

  // Auto-advance: once every seat has submitted, wait 5s (cancellable) then advance.
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
        }
      );
    }, AUTO_ADVANCE_GRACE_MS);
    return () => {
      clearTimeout(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allSeatsReady, autoAdvanceCancelled, currentEntry?.id]);

  if (!currentEntry) {
    return (
      <ScreenShell state={state}>
        <Card className="p-[60px_20px] text-center text-[14.5px] text-[#7A8781]">
          Every ride in this class has been scored, scratched, or disqualified.
        </Card>
        {permissions.canEditShow && (
          <div className="mt-6 flex flex-col gap-4">
            <LiveProgressPanel
              classId={classId}
              entries={state.entries}
              panel={state.panel}
              scores={state.scores}
              test={state.test}
              currentEntryId={null}
            />
            <PanelAssignmentCard classId={classId} panel={state.panel} candidates={panelCandidates} />
          </div>
        )}
        <div className="mt-6">
          <StandingsPanel entries={state.entries} />
        </div>
      </ScreenShell>
    );
  }

  const locked = !mySeat || myScore?.submitted === true;
  const seatId = mySeat?.seatId ?? '';
  const seatRole = mySeat?.role ?? 'judge';
  const complete = test ? isSheetComplete(toSheet(myScore ?? blankScore()), test) : false;
  const canSubmit = seatRole === 'judge' && complete && !myScore?.submitted;

  function blankScore(): Omit<ScoreRow, 'id' | 'entryId' | 'seatId' | 'signedBy' | 'signedAt' | 'updatedAt'> {
    return { movements: {}, collectives: {}, errors: 0, errorAt: {}, remarks: {}, finalRemarks: '', submitted: false };
  }

  function afterAction() {
    void refetch();
  }

  /**
   * Echoes a mark/collective/error/remark write into local state immediately
   * — the poll (`refetch`) reconciles within 4s regardless, but a judge
   * shouldn't wait that long to see their own just-entered mark. Legacy's
   * own screen updated its in-memory model the same way, ahead of the
   * server round trip.
   */
  function updateMyScore(updater: (score: ScoreRow) => ScoreRow) {
    if (!mySeat || !currentEntry) return;
    applyOptimistic((prev) => {
      const existing = prev.scores.find((s) => s.entryId === currentEntry.id && s.seatId === mySeat.seatId);
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
        idx >= 0
          ? prev.scores.map((s, i) => (i === idx ? updated : s))
          : [...prev.scores, updated];
      return { ...prev, scores };
    });
  }

  return (
    <ScreenShell state={state}>
      <div className="mb-6">
        <ScoringToolbar
          open={state.classState.open}
          resultsPublished={state.classState.resultsPublished}
          permissions={permissions}
          isTogglingOpen={toggleOpen.isPending}
          isPublishing={publish.isPending || unpublish.isPending}
          onToggleOpen={() => {
            toggleOpen.mutate({ classId, open: !state.classState.open }, { onSuccess: afterAction });
          }}
          onPublish={() => {
            publish.mutate({ classId }, { onSuccess: afterAction });
          }}
          onUnpublish={() => {
            unpublish.mutate({ classId }, { onSuccess: afterAction });
          }}
          onPrint={() => {
            window.print();
          }}
        />
      </div>

      <LiveClockStrip
        scheduledTime={state.scheduledTime}
        ringLabel={state.ring ?? 'Ring'}
        pos={state.classState.pos}
        rideStartedAt={currentEntry.rideStartedAt}
      />

      {!test ? (
        <NotARealTestBanner />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-[Newsreader,serif] text-xl font-semibold text-ink-deep">
                #{currentEntry.num} {currentEntry.rider ?? '—'}
                {currentEntry.horse ? ` · ${currentEntry.horse}` : ''}
              </h2>
              <p className="text-[13px] text-[#7A8781]">{test.name}</p>
            </div>
            <PanelStatusStrip panel={state.panel} scores={state.scores} entryId={currentEntry.id} />
          </div>

          {!mySeat && (
            <Card className="p-4 text-[13px] text-[#7A8781]">
              You don&apos;t hold a seat on this panel — viewing only.
            </Card>
          )}

          <ScoreTally score={myScore} test={test} />

          <TestSheet
            test={test}
            score={myScore}
            seatRole={seatRole}
            locked={locked}
            defaultCollapsed={seatRole === 'judge'}
            handleRef={sheetHandleRef}
            onSetMark={(movementNum, value) => {
              if (!mySeat) return;
              const key = String(movementNum);
              updateMyScore((s) => ({
                ...s,
                movements: { ...s.movements, [key]: { value, enteredBy: seatRole } },
                submitted: false,
              }));
              setMark.mutate({ classId, entryId: currentEntry.id, seatId, seatRole, movementNum, value });
            }}
            onSetCollective={(key, value) => {
              if (!mySeat) return;
              updateMyScore((s) => ({
                ...s,
                collectives: { ...s.collectives, [key]: { value, enteredBy: seatRole } },
                submitted: false,
              }));
              setCollective.mutate({ classId, entryId: currentEntry.id, seatId, seatRole, key, value });
            }}
            onToggleError={(movementNum) => {
              if (!mySeat) return;
              const key = String(movementNum);
              updateMyScore((s) => {
                const errorAt = { ...s.errorAt, [key]: !s.errorAt[key] };
                return { ...s, errorAt, errors: Object.values(errorAt).filter(Boolean).length };
              });
              toggleError.mutate({ classId, entryId: currentEntry.id, seatId, movementNum });
            }}
            onSetRemark={(movementNum, text) => {
              if (!mySeat) return;
              const key = String(movementNum);
              updateMyScore((s) => ({ ...s, remarks: { ...s.remarks, [key]: text } }));
              setRemark.mutate({ classId, entryId: currentEntry.id, seatId, movementNum, text });
            }}
            onSetFinalRemarks={(text) => {
              if (!mySeat) return;
              updateMyScore((s) => ({ ...s, finalRemarks: text }));
              setFinalRemarks.mutate({ classId, entryId: currentEntry.id, seatId, text });
            }}
          />

          <ErrorOfCoursePanel
            errors={myScore?.errors ?? 0}
            errorAt={myScore?.errorAt ?? {}}
            test={test}
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <RideActionsBar
              permissions={permissions}
              disabled={skip.isPending || unskip.isPending || scratch.isPending || disqualify.isPending}
              canUndo={lastUndo !== null}
              onSkip={() => {
                skip.mutate(
                  { classId, entryId: currentEntry.id },
                  {
                    onSuccess: () => {
                      setLastUndo({ entryId: currentEntry.id, kind: 'skip' });
                      afterAction();
                    },
                  }
                );
              }}
              onScratch={() => {
                if (!window.confirm(`Scratch #${currentEntry.num}? They'll stay on the running order, marked as scratched.`)) return;
                scratch.mutate(
                  { classId, entryId: currentEntry.id },
                  {
                    onSuccess: () => {
                      setLastUndo({ entryId: currentEntry.id, kind: 'terminal' });
                      afterAction();
                    },
                  }
                );
              }}
              onDisqualify={() => {
                setReasonModal('disqualify');
              }}
              onUndo={() => {
                if (!lastUndo) return;
                if (lastUndo.kind === 'skip') {
                  unskip.mutate({ classId, entryId: lastUndo.entryId }, { onSuccess: afterAction });
                } else {
                  unfinish.mutate({ classId, entryId: lastUndo.entryId }, { onSuccess: afterAction });
                }
                setLastUndo(null);
              }}
            />

            {seatRole === 'scribe' ? (
              <span className="text-[13px] font-semibold text-[#7A8781]">
                Waiting for judge&apos;s signature
              </span>
            ) : (
              <button
                type="button"
                disabled={!canSubmit}
                onClick={() => {
                  sheetHandleRef.current?.flushPendingWrites();
                  setSignatureOpen(true);
                }}
                className="rounded-[9px] bg-[#1D4A38] px-5 py-[13px] text-[13.5px] font-bold text-[#F5F7F6] transition-colors hover:bg-gold hover:text-[#0D2C23] disabled:cursor-not-allowed disabled:bg-[#F1F4F3] disabled:text-[#B4BFB9]"
              >
                Sign &amp; Submit
              </button>
            )}
          </div>

          {allSeatsReady && !autoAdvanceCancelled && (
            <div className="flex items-center gap-3 rounded-xl border border-[#BFE0CB] bg-[#DCEFE1] p-[12px_16px] text-[13px] text-[#2E7D46]">
              Every seat has submitted — moving to the next rider shortly.
              <button
                type="button"
                onClick={() => {
                  setAutoAdvanceCancelled(true);
                }}
                className="font-semibold underline"
              >
                Cancel auto-advance
              </button>
            </div>
          )}

          <PrintScoresheet
            showName={state.showName}
            className={state.className}
            entry={currentEntry}
            test={test}
            score={myScore}
            judgeName={mySeat?.name ?? ''}
            judgePosition={state.panel.find((p) => p.seatId === mySeat?.seatId)?.position ?? null}
          />
        </div>
      )}

      {permissions.canEditShow && (
        <div className="mt-8 flex flex-col gap-4">
          <LiveProgressPanel
            classId={classId}
            entries={state.entries}
            panel={state.panel}
            scores={state.scores}
            test={state.test}
            currentEntryId={currentEntry.id}
          />
          <PanelAssignmentCard classId={classId} panel={state.panel} candidates={panelCandidates} />
        </div>
      )}

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <HoldingQueuePanel
          classId={classId}
          holdingEntries={state.holdingEntries}
          workingInEntryId={state.classState.workingInEntryId}
          canManage={permissions.canManageHoldingQueue}
        />
        <StandingsPanel entries={state.entries} />
      </div>

      <SignatureModal
        open={signatureOpen}
        onOpenChange={setSignatureOpen}
        judgeName={mySeat?.name ?? ''}
        isPending={submit.isPending}
        onConfirm={() => {
          submit.mutate(
            { classId, entryId: currentEntry.id, seatId },
            {
              onSuccess: () => {
                setSignatureOpen(false);
                afterAction();
              },
            }
          );
        }}
      />

      <ReasonModal
        open={reasonModal === 'disqualify'}
        onOpenChange={(open) => {
          if (!open) setReasonModal(null);
        }}
        title="Disqualify this ride"
        description="A reason is required — it's shown to the organizer."
        required
        isPending={disqualify.isPending}
        onConfirm={(reason) => {
          disqualify.mutate(
            { classId, entryId: currentEntry.id, reason },
            {
              onSuccess: () => {
                setReasonModal(null);
                setLastUndo({ entryId: currentEntry.id, kind: 'terminal' });
                afterAction();
              },
            }
          );
        }}
      />
    </ScreenShell>
  );
}

function ScreenShell({ state, children }: { state: ClassScoringState; children: React.ReactNode }) {
  return (
    <>
      <div className="mb-[22px] flex flex-wrap items-start justify-between gap-5">
        <div>
          <ScreenTitle>{state.className}</ScreenTitle>
          <ScreenLede className="mb-0">{state.showName}</ScreenLede>
        </div>
        <div className="flex items-center gap-2">
          <StatusPill bg="#FFFFFF" border="#E9EDEB" fg="#16261F">
            {state.classState.open ? 'Scoring open' : 'Scoring closed'}
          </StatusPill>
          <Link
            href="/dashboard/judging"
            className="text-[13px] font-semibold text-[#5A6B63] hover:text-gold"
          >
            ← Back to assignments
          </Link>
        </div>
      </div>
      {children}
    </>
  );
}
