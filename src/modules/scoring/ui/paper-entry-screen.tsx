'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState, type KeyboardEvent } from 'react';
import {
  EmptyState,
  FA_BTN,
  FA_BTN_PRIMARY,
  FA_BTN_DANGER,
  FA_SELECT,
  FaCard,
  PageHeader,
  Pill,
  type PillTone,
} from '@/shared/ui/organizer/fa-page';
import { cn } from '@/shared/lib/utils';
import {
  useScratchRide,
  useToggleScoringOpen,
} from '@/modules/scoring/hooks/use-scoring-mutations';
import {
  usePaperSheetForm,
  useSavePaperSheet,
  type PaperSeat,
} from '@/modules/scoring/hooks/use-paper-entry';
import { paperRideStatus, type PaperRideState } from '@/modules/scoring/utils/paper-ride-status';
import type {
  ClassScoringState,
  RideEntry,
  ScoreRow,
  TestDefinition,
} from '@/modules/scoring/types';

const STATE_TONE: Record<PaperRideState, PillTone> = {
  todo: 'yellow',
  paper: 'green',
  live: 'blue',
  scratched: 'grey',
  eliminated: 'red',
};

const ERROR_CHOICES = [0, 1, 2, 3];

/** Show-office screen for typing in signed paper score sheets after an
 * offline show. One ride at a time; "Save sheet" moves to the next ride
 * still to enter. */
export function PaperEntryScreen({
  classId,
  state,
}: {
  classId: string;
  state: ClassScoringState;
}) {
  const router = useRouter();
  const closeLive = useToggleScoringOpen();
  const rides = state.entries;
  const statuses = new Map(rides.map((ride) => [ride.id, paperRideStatus(ride, state.scores)]));
  const toEnter = rides.filter((ride) => statuses.get(ride.id)?.state === 'todo');
  const [selectedId, setSelectedId] = useState<string | null>(toEnter[0]?.id ?? null);
  const selected = rides.find((ride) => ride.id === selectedId) ?? null;

  const seats: PaperSeat[] = state.panel
    .filter((seat) => seat.judgeStaffId !== null)
    .map((seat) => ({ seatId: seat.seatId, judgeName: seat.judgeName ?? seat.seatId }));

  function selectNextAfter(entryId: string) {
    const index = rides.findIndex((ride) => ride.id === entryId);
    const next = [...rides.slice(index + 1), ...rides.slice(0, index)].find(
      (ride) => statuses.get(ride.id)?.state === 'todo',
    );
    setSelectedId(next?.id ?? null);
  }

  const done = rides.length - toEnter.length;
  const blocked = state.classState.open || state.classState.resultsPublished;

  return (
    <div className="text-ink-deep">
      <PageHeader
        eyebrow={`${state.showName} · Enter paper score sheets`}
        title={state.className}
        actions={
          <Link href={`/dashboard/scoring/${classId}`} prefetch={false} className={FA_BTN}>
            Back to live scoring
          </Link>
        }
      />

      <p className="mb-4 text-[14px] text-[#5A6B63]">
        Type each judge&apos;s signed sheet in exactly as written. The total updates as you type —
        check it matches the paper, then press <strong>Save sheet</strong>.{' '}
        <strong>
          {done} of {rides.length}
        </strong>{' '}
        rides done.
      </p>

      {state.classState.open && (
        <FaCard tone="warn" className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[14px] font-semibold">
            Live scoring is open for this class. Close it before typing in paper sheets, so nobody
            scores it live at the same time.
          </p>
          <button
            type="button"
            className={FA_BTN_PRIMARY}
            disabled={closeLive.isPending}
            onClick={() => {
              closeLive.mutate(
                { classId, open: false },
                {
                  onSuccess: () => {
                    router.refresh();
                  },
                },
              );
            }}
          >
            Close live scoring
          </button>
        </FaCard>
      )}
      {state.classState.resultsPublished && (
        <FaCard tone="warn" className="mb-4">
          <p className="text-[14px] font-semibold">
            Results for this class are published. Unpublish them on the live scoring screen to
            change a sheet.
          </p>
        </FaCard>
      )}

      {seats.length === 0 ? (
        <EmptyState
          title="No judges assigned to this class"
          note="Assign the judge(s) on the live scoring screen, then come back to enter their sheets."
        />
      ) : rides.length === 0 ? (
        <EmptyState title="No riders in this class" />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <FaCard className="p-0">
            <ul className="divide-y divide-[#EDF0EE]">
              {rides.map((ride) => {
                const status = statuses.get(ride.id);
                return (
                  <li key={ride.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedId(ride.id);
                      }}
                      className={cn(
                        'flex w-full items-center justify-between gap-2 px-4 py-3 text-left hover:bg-[#F5F7F6]',
                        ride.id === selectedId && 'bg-[#E9F4EE]',
                      )}
                    >
                      <span className="min-w-0">
                        <span className="block text-[14px] font-bold">
                          #{ride.num} {ride.rider ?? 'Rider'}
                        </span>
                        <span className="block truncate text-[12.5px] text-[#5A6B63]">
                          {ride.horse ?? ''}
                        </span>
                      </span>
                      {status && <Pill tone={STATE_TONE[status.state]}>{status.label}</Pill>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </FaCard>

          {selected ? (
            <RidePanel
              key={selected.id}
              classId={classId}
              ride={selected}
              test={selected.testOverride ?? state.test}
              seats={seats}
              scores={state.scores}
              canEnter={!blocked && (statuses.get(selected.id)?.canEnter ?? false)}
              statusLabel={statuses.get(selected.id)?.label ?? ''}
              onSaved={() => {
                selectNextAfter(selected.id);
                router.refresh();
              }}
            />
          ) : (
            <EmptyState
              title="All sheets entered"
              note="Check the results on the live scoring screen, then publish them there."
            />
          )}
        </div>
      )}
    </div>
  );
}

function RidePanel({
  classId,
  ride,
  test,
  seats,
  scores,
  canEnter,
  statusLabel,
  onSaved,
}: {
  classId: string;
  ride: RideEntry;
  test: TestDefinition | null;
  seats: PaperSeat[];
  scores: ScoreRow[];
  canEnter: boolean;
  statusLabel: string;
  onSaved: () => void;
}) {
  const router = useRouter();
  const scratch = useScratchRide();

  if (!test) {
    return (
      <EmptyState
        title="This class has no test assigned"
        note="Choose the test on the live scoring screen first."
      />
    );
  }

  return (
    <FaCard>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-[18px] font-bold">
            #{ride.num} {ride.rider ?? 'Rider'}
            {ride.horse ? ` · ${ride.horse}` : ''}
          </h2>
          <p className="text-[13px] text-[#5A6B63]">
            {test.name} · {statusLabel}
          </p>
        </div>
        {canEnter && (
          <button
            type="button"
            className={FA_BTN_DANGER}
            disabled={scratch.isPending}
            onClick={() => {
              if (!window.confirm(`Mark #${ride.num} as scratched (did not ride)?`)) return;
              scratch.mutate(
                { classId, entryId: ride.id },
                {
                  onSuccess: () => {
                    onSaved();
                    router.refresh();
                  },
                },
              );
            }}
          >
            Did not ride (scratch)
          </button>
        )}
      </div>

      {canEnter ? (
        <SheetForm
          classId={classId}
          entryId={ride.id}
          test={test}
          seats={seats}
          scores={scores}
          onSaved={onSaved}
        />
      ) : (
        <p className="text-[14px] text-[#5A6B63]">
          Nothing to type in for this ride here. Use the live scoring screen to change it.
        </p>
      )}
    </FaCard>
  );
}

function SheetForm({
  classId,
  entryId,
  test,
  seats,
  scores,
  onSaved,
}: {
  classId: string;
  entryId: string;
  test: TestDefinition;
  seats: PaperSeat[];
  scores: ScoreRow[];
  onSaved: () => void;
}) {
  const form = usePaperSheetForm({ classId, entryId, test, seats, scores });
  const save = useSavePaperSheet();
  const formRef = useRef<HTMLFormElement>(null);

  // Enter moves to the next box for the same judge, then on to the next
  // judge — paper sheets are typed one judge at a time.
  function focusNext(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    const boxes = Array.from(
      formRef.current?.querySelectorAll<HTMLInputElement>('input[data-order]') ?? [],
    ).sort((a, b) => Number(a.dataset.order) - Number(b.dataset.order));
    const index = boxes.indexOf(event.currentTarget);
    boxes[index + 1]?.focus();
  }

  const rowCount = test.movements.length + test.collectives.length;
  const order = (seatIndex: number, row: number) => seatIndex * rowCount + row;

  return (
    <form
      ref={formRef}
      onSubmit={(event) => {
        event.preventDefault();
        if (!form.allComplete) return;
        save.mutate(form.toInput(), { onSuccess: onSaved });
      }}
    >
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[13.5px]">
          <thead>
            <tr className="bg-[#F5F7F6] text-left text-[11px] tracking-[.06em] text-[#5A6B63] uppercase">
              <th className="px-2 py-2">#</th>
              <th className="px-2 py-2">Movement</th>
              <th className="px-2 py-2 text-center">Coef</th>
              {form.perSeat.map(({ seat }) => (
                <th key={seat.seatId} className="px-2 py-2 text-center">
                  {seat.judgeName}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {test.movements.map((m, row) => (
              <tr key={`m-${String(m.num)}`} className="border-t border-[#EDF0EE]">
                <td className="px-2 py-1.5 font-bold">{m.num}</td>
                <td className="px-2 py-1.5 text-[#5A6B63]">{m.text}</td>
                <td className="px-2 py-1.5 text-center">
                  {m.coef > 1 ? `×${String(m.coef)}` : ''}
                </td>
                {form.perSeat.map(({ seat, draft, invalid }, seatIndex) => (
                  <td key={seat.seatId} className="px-2 py-1.5 text-center">
                    <MarkBox
                      label={`${seat.judgeName}, movement ${String(m.num)}`}
                      value={draft.movements[String(m.num)] ?? ''}
                      invalid={invalid.has(`m:${String(m.num)}`)}
                      order={order(seatIndex, row)}
                      autoFocus={seatIndex === 0 && row === 0}
                      onChange={(text) => {
                        form.setMovement(seat.seatId, String(m.num), text);
                      }}
                      onKeyDown={focusNext}
                    />
                  </td>
                ))}
              </tr>
            ))}
            {test.collectives.map((c, i) => (
              <tr key={`c-${c.key}`} className="border-t border-[#EDF0EE] bg-[#FBFCFB]">
                <td className="px-2 py-1.5 font-bold">C</td>
                <td className="px-2 py-1.5 text-[#5A6B63]">{c.label}</td>
                <td className="px-2 py-1.5 text-center">
                  {c.coef > 1 ? `×${String(c.coef)}` : ''}
                </td>
                {form.perSeat.map(({ seat, draft, invalid }, seatIndex) => (
                  <td key={seat.seatId} className="px-2 py-1.5 text-center">
                    <MarkBox
                      label={`${seat.judgeName}, ${c.label}`}
                      value={draft.collectives[c.key] ?? ''}
                      invalid={invalid.has(`c:${c.key}`)}
                      order={order(seatIndex, test.movements.length + i)}
                      onChange={(text) => {
                        form.setCollective(seat.seatId, c.key, text);
                      }}
                      onKeyDown={focusNext}
                    />
                  </td>
                ))}
              </tr>
            ))}
            <tr className="border-t-2 border-[#C9D3CE]">
              <td className="px-2 py-2" />
              <td className="px-2 py-2 font-bold" colSpan={2}>
                Errors of course
              </td>
              {form.perSeat.map(({ seat, draft }) => (
                <td key={seat.seatId} className="px-2 py-2 text-center">
                  <select
                    aria-label={`${seat.judgeName}, errors of course`}
                    className={FA_SELECT}
                    value={draft.errors}
                    onChange={(event) => {
                      form.setErrors(seat.seatId, Number(event.target.value));
                    }}
                  >
                    {ERROR_CHOICES.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </td>
              ))}
            </tr>
            <tr className="border-t border-[#EDF0EE]">
              <td className="px-2 py-2" />
              <td className="px-2 py-2 font-bold" colSpan={2}>
                Judge&apos;s total
              </td>
              {form.perSeat.map(({ seat, pctLabel }) => (
                <td key={seat.seatId} className="px-2 py-2 text-center font-bold">
                  {pctLabel ?? <span className="text-[#8A94A3]">not finished</span>}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[15px]">
          Final score:{' '}
          <strong className="text-[18px]">{form.finalLabel ?? 'enter every mark first'}</strong>
        </p>
        <button
          type="submit"
          className={FA_BTN_PRIMARY}
          disabled={!form.allComplete || save.isPending}
        >
          {save.isPending ? 'Saving…' : 'Save sheet'}
        </button>
      </div>
    </form>
  );
}

function MarkBox({
  label,
  value,
  invalid,
  order,
  autoFocus,
  onChange,
  onKeyDown,
}: {
  label: string;
  value: string;
  invalid: boolean;
  order: number;
  autoFocus?: boolean;
  onChange: (text: string) => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
}) {
  return (
    <input
      aria-label={label}
      aria-invalid={invalid}
      inputMode="decimal"
      autoComplete="off"
      autoFocus={autoFocus}
      data-order={order}
      value={value}
      onChange={(event) => {
        onChange(event.target.value);
      }}
      onKeyDown={onKeyDown}
      className={cn(
        'w-16 rounded-[8px] border-2 bg-white px-2 py-1.5 text-center text-[15px] font-bold outline-none',
        invalid
          ? 'border-[#B42318] bg-[#FDEEEB]'
          : 'border-[#C9D3CE] focus-visible:border-[#1A5B3C]',
      )}
    />
  );
}
