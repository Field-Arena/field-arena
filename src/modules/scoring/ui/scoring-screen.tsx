'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Card } from '@/shared/ui/organizer/card';
import { Button } from '@/shared/ui/shadcn/button';
import type { PermissionKey } from '@/shared/constants/permissions';
import { AUTO_ADVANCE_GRACE_MS, UNDO_WINDOW_MS } from '@/modules/scoring/constants';
import { isSheetComplete } from '@/modules/scoring/scoring-engine';
import { toSheet } from '@/modules/scoring/utils/to-sheet';
import { resolveEffectiveTest } from '@/modules/scoring/utils/resolve-effective-test';
import { useScoringState } from '@/modules/scoring/hooks/use-scoring-state';
import { pickRideInRing } from '@/shared/lib/current-ride';
import { useStartRideOnView } from '@/modules/scoring/hooks/use-start-ride-on-view';
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
} from '@/modules/scoring/hooks/use-scoring-mutations';
import { useMarkOrderChecked } from '@/modules/scoring/hooks/use-order-check-mutations';
import { TestSheet, type TestSheetHandle } from '@/modules/scoring/ui/test-sheet';
import { ScoreTally } from '@/modules/scoring/ui/score-tally';
import { ErrorOfCoursePanel } from '@/modules/scoring/ui/error-of-course-panel';
import { PanelStatusStrip } from '@/modules/scoring/ui/panel-status-strip';
import { SignatureModal } from '@/modules/scoring/ui/signature-modal';
import { ReasonModal } from '@/modules/scoring/ui/reason-modal';
import { RideActionsBar } from '@/modules/scoring/ui/ride-actions-bar';
import { HoldingQueuePanel } from '@/modules/scoring/ui/holding-queue-panel';
import { LiveProgressPanel } from '@/modules/scoring/ui/live-progress-panel';
import { PanelAssignmentCard } from '@/modules/scoring/ui/panel-assignment-card';
import { StandingsPanel } from '@/modules/scoring/ui/standings-panel';
import { ScoringToolbar } from '@/modules/scoring/ui/scoring-toolbar';
import { NotARealTestBanner } from '@/modules/scoring/ui/not-a-real-test-banner';
import { LiveClockStrip } from '@/modules/scoring/ui/live-clock-strip';
import { PrintScoresheet } from '@/modules/scoring/ui/print-scoresheet';
import type { ClassScoringState, MySeat, PanelCandidate, ScoreRow } from '@/modules/scoring/types';

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

  const currentEntry = useMemo(
    () =>
      pickRideInRing({
        workingInEntryId: state.classState.workingInEntryId,
        rides: state.entries,
        holdingRides: state.holdingEntries,
        pos: state.classState.pos,
      }),
    [state],
  );

  const test = resolveEffectiveTest(currentEntry?.testOverride ?? null, state.test);
  const myScore = currentEntry
    ? state.scores.find((s) => s.entryId === currentEntry.id && s.seatId === mySeat?.seatId)
    : undefined;

  const sheetHandleRef = useRef<TestSheetHandle>(null);

  // Marks still debouncing for the previous rider go out before the sheet
  // switches to the next one (each pending write already carries its rider).
  useEffect(() => {
    const handle = sheetHandleRef.current;
    return () => {
      handle?.flushPendingWrites();
    };
  }, [currentEntry?.id]);

  useStartRideOnView({
    classId,
    entryId: currentEntry?.id ?? null,
    rideStartedAt: currentEntry?.rideStartedAt ?? null,
    enabled: mySeat !== null || permissions.canEditShow,
    onStarted: () => {
      void refetch();
    },
  });
  const [signatureOpen, setSignatureOpen] = useState(false);
  const [reasonModal, setReasonModal] = useState<'disqualify' | null>(null);
  const [lastUndo, setLastUndo] = useState<{ entryId: string; kind: 'skip' | 'terminal' } | null>(
    null,
  );
  const [autoAdvanceCancelled, setAutoAdvanceCancelled] = useState(false);

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
  const markOrderChecked = useMarkOrderChecked();

  useEffect(() => {
    if (!lastUndo) return;
    const id = setTimeout(() => {
      setLastUndo(null);
    }, UNDO_WINDOW_MS);
    return () => {
      clearTimeout(id);
    };
  }, [lastUndo]);

  // Only seats with a judge can sign; an empty (or judge-less) panel must
  // never count as "everyone has submitted" and auto-advance the class.
  const judgeSeats = state.panel.filter((seat) => seat.judgeStaffId !== null);
  const allSeatsReady = Boolean(
    currentEntry &&
    judgeSeats.length > 0 &&
    judgeSeats.every(
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

  if (!currentEntry) {
    const hasNoEntries = state.entries.length === 0 && state.holdingEntries.length === 0;
    return (
      <ScreenShell state={state}>
        <Card className="p-[60px_20px] text-center text-[14.5px] text-[#8A94A3]">
          {hasNoEntries
            ? 'No riders are entered in this class yet.'
            : 'Every ride in this class has been scored, scratched, or disqualified.'}
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
            <PanelAssignmentCard
              classId={classId}
              panel={state.panel}
              candidates={panelCandidates}
            />
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

  function blankScore(): Omit<
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
            toggleOpen.mutate(
              { classId, open: !state.classState.open },
              { onSuccess: afterAction },
            );
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
          mySeat={mySeat}
          orderChecked={state.classState.orderChecked}
          isMarkingOrderChecked={markOrderChecked.isPending}
          onMarkOrderChecked={() => {
            markOrderChecked.mutate(classId);
          }}
        />
      </div>

      <LiveClockStrip
        scheduledTime={state.scheduledTime}
        timeZone={state.timeZone}
        ringLabel={state.ring ?? 'Ring'}
        pos={state.classState.pos}
        rideStartedAt={currentEntry.rideStartedAt}
      />

      {mySeat && (
        <div className="mb-4 flex flex-wrap items-center gap-2 text-[12.5px] text-[var(--fa-ink-3)]">
          Acting as
          <span className="rounded-[8px] border border-[var(--fa-line)] bg-white px-2.5 py-1 text-[12.5px] font-semibold text-[var(--fa-ink)]">
            {mySeat.name}
            {(() => {
              const position = state.panel.find((p) => p.seatId === mySeat.seatId)?.position;
              return ` — ${mySeat.role === 'judge' ? 'Judge' : 'Scribe'}${position ? ` at ${position}` : ''}`;
            })()}
          </span>
        </div>
      )}

      {!test ? (
        <NotARealTestBanner />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="rounded-[var(--fa-radius)] border border-[#F3E3C0] bg-[#FFFBF2] px-5 py-4 shadow-[var(--fa-shadow-sm)]">
            <div className="text-[10.5px] font-bold tracking-[.1em] text-[#B45309] uppercase">
              Now in ring
            </div>
            <div className="mt-1 font-[family-name:var(--fa-serif)] text-[26px] leading-tight font-semibold text-[var(--fa-ink)]">
              #{currentEntry.num} · {currentEntry.rider ?? '—'}
            </div>
            <div className="mt-0.5 text-[13.5px] text-[var(--fa-ink-2)]">
              {currentEntry.horse ?? '—'} · {test.name}
              {state.sponsor ? ` · Presented by ${state.sponsor}` : ''}
            </div>
          </div>

          <PanelStatusStrip panel={state.panel} scores={state.scores} entryId={currentEntry.id} />

          {mySeat && (
            <div className="fa-callout !mb-0 !border-[#CFE3F5] !bg-[var(--fa-sky-tint)] !text-[#0B4F87]">
              <svg
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <circle cx="12" cy="12" r="9" />
                <path strokeLinecap="round" d="M12 11v5M12 8h.01" />
              </svg>
              <span>
                {mySeat.role === 'judge'
                  ? 'Call marks as the rider goes — your scribe records alongside you. Once every mark and collective has a value, add your remarks and sign to submit. The rider advances once every judge on the panel has submitted.'
                  : 'Record each mark as the judge calls it. Once every mark and collective has a value, the judge adds remarks and signs to submit.'}
              </span>
            </div>
          )}

          {!mySeat && (
            <Card className="p-4 text-[13px] text-[#8A94A3]">
              You don&apos;t hold a seat on this panel — viewing only.
            </Card>
          )}

          <div className="fa-card">
            <div className="fa-card-head">
              <div>
                <h3>Scoresheet — {test.name}</h3>
                <div className="fa-sub">
                  {test.movements.length} movements · {test.collectives.length} collective marks
                  {state.sponsor ? ` · Presented by ${state.sponsor}` : ''}
                </div>
              </div>
              <ScoreTally score={myScore} test={test} />
            </div>

            <TestSheet
              test={test}
              score={myScore}
              seatRole={seatRole}
              locked={locked}
              defaultCollapsed={false}
              handleRef={sheetHandleRef}
              deductions={
                <ErrorOfCoursePanel
                  errors={myScore?.errors ?? 0}
                  errorAt={myScore?.errorAt ?? {}}
                  test={test}
                />
              }
              onSetMark={(movementNum, value) => {
                if (!mySeat) return;
                const key = String(movementNum);
                updateMyScore((s) => ({
                  ...s,
                  movements: { ...s.movements, [key]: { value, enteredBy: seatRole } },
                  submitted: false,
                }));
                setMark.mutate({
                  classId,
                  entryId: currentEntry.id,
                  seatId,
                  seatRole,
                  movementNum,
                  value,
                });
              }}
              onSetCollective={(key, value) => {
                if (!mySeat) return;
                updateMyScore((s) => ({
                  ...s,
                  collectives: { ...s.collectives, [key]: { value, enteredBy: seatRole } },
                  submitted: false,
                }));
                setCollective.mutate({
                  classId,
                  entryId: currentEntry.id,
                  seatId,
                  seatRole,
                  key,
                  value,
                });
              }}
              onToggleError={(movementNum) => {
                if (!mySeat) return;
                const key = String(movementNum);
                const value = !myScore?.errorAt[key];
                updateMyScore((s) => {
                  const errorAt = { ...s.errorAt, [key]: value };
                  return { ...s, errorAt, errors: Object.values(errorAt).filter(Boolean).length };
                });
                toggleError.mutate({
                  classId,
                  entryId: currentEntry.id,
                  seatId,
                  movementNum,
                  value,
                });
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

            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <RideActionsBar
                permissions={permissions}
                disabled={
                  skip.isPending || unskip.isPending || scratch.isPending || disqualify.isPending
                }
                canUndo={lastUndo !== null}
                onSkip={() => {
                  skip.mutate(
                    { classId, entryId: currentEntry.id },
                    {
                      onSuccess: () => {
                        setLastUndo({ entryId: currentEntry.id, kind: 'skip' });
                        afterAction();
                      },
                    },
                  );
                }}
                onScratch={() => {
                  if (
                    !window.confirm(
                      `Scratch #${currentEntry.num}? They'll stay on the running order, marked as scratched.`,
                    )
                  )
                    return;
                  scratch.mutate(
                    { classId, entryId: currentEntry.id },
                    {
                      onSuccess: () => {
                        setLastUndo({ entryId: currentEntry.id, kind: 'terminal' });
                        afterAction();
                      },
                    },
                  );
                }}
                onDisqualify={() => {
                  setReasonModal('disqualify');
                }}
                onUndo={() => {
                  if (!lastUndo) return;
                  if (lastUndo.kind === 'skip') {
                    unskip.mutate(
                      { classId, entryId: lastUndo.entryId },
                      { onSuccess: afterAction },
                    );
                  } else {
                    unfinish.mutate(
                      { classId, entryId: lastUndo.entryId },
                      { onSuccess: afterAction },
                    );
                  }
                  setLastUndo(null);
                }}
              />

              {seatRole === 'scribe' ? (
                <span className="text-[13px] font-semibold text-[#8A94A3]">
                  Waiting for judge&apos;s signature
                </span>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  disabled={!canSubmit}
                  onClick={() => {
                    sheetHandleRef.current?.flushPendingWrites();
                    setSignatureOpen(true);
                  }}
                  className="fa-btn fa-btn-primary h-auto disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Sign &amp; submit final score →
                </Button>
              )}
            </div>
          </div>

          {allSeatsReady && !autoAdvanceCancelled && (
            <div className="flex items-center gap-3 rounded-xl border border-[#BFE0CB] bg-[#DCEFE1] p-[12px_16px] text-[13px] text-[#2E7D46]">
              Every seat has submitted — moving to the next rider shortly.
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setAutoAdvanceCancelled(true);
                }}
                className="h-auto rounded-none px-0 py-0 text-[13px] font-semibold underline hover:bg-transparent"
              >
                Cancel auto-advance
              </Button>
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
            },
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
            },
          );
        }}
      />
    </ScreenShell>
  );
}

function ScreenShell({ state, children }: { state: ClassScoringState; children: React.ReactNode }) {
  const lede = [state.className, state.showName, state.ring].filter(Boolean).join(' · ');
  return (
    <section>
      <Link href="/dashboard/judging" prefetch={false} className="fa-backlink">
        <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
        </svg>
        Back to Judge / Scribe Workspace
      </Link>
      <div className="fa-page-head">
        <div>
          <h2 className="!text-[24px]">Live Scoring</h2>
          <p>{lede}</p>
        </div>
        <span
          className={`fa-badge ${state.classState.open ? 'fa-live' : 'fa-stub'} !px-3 !py-1.5 !tracking-[.06em] uppercase`}
        >
          <span className="fa-dot" />
          {state.classState.open ? 'Live · scores posting' : 'Scoring closed'}
        </span>
      </div>
      {children}
    </section>
  );
}
