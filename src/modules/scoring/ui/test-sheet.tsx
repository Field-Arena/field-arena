'use client';

import { useImperativeHandle, useState, type Ref } from 'react';
import { useDebouncedWrite } from '../hooks/use-debounced-write';
import { MarkStepper } from './mark-stepper';
import type { ScoreRow, TestDefinition } from '../types';

export interface TestSheetHandle {
  flushPendingWrites: () => void;
}

/**
 * The movement/collective mark grid, ported from showrunner-scoring.html's
 * scoresheet body. One row per movement (mark + ⚠ error toggle + remark),
 * then the collectives, then a single "Final remarks" box for the whole
 * ride.
 */
export function TestSheet({
  test,
  score,
  seatRole,
  locked,
  onSetMark,
  onSetCollective,
  onToggleError,
  onSetRemark,
  onSetFinalRemarks,
  handleRef,
}: {
  test: TestDefinition;
  score: ScoreRow | undefined;
  seatRole: 'judge' | 'scribe';
  locked: boolean;
  onSetMark: (movementNum: number, value: number) => void;
  onSetCollective: (key: string, value: number) => void;
  onToggleError: (movementNum: number) => void;
  onSetRemark: (movementNum: number, text: string) => void;
  onSetFinalRemarks: (text: string) => void;
  handleRef?: Ref<TestSheetHandle>;
}) {
  const movementWrite = useDebouncedWrite<number>((key, value) => {
    onSetMark(Number(key), value);
  });
  const collectiveWrite = useDebouncedWrite<number>((key, value) => {
    onSetCollective(key, value);
  });
  const remarkWrite = useDebouncedWrite<string>((key, value) => {
    onSetRemark(Number(key), value);
  });
  const finalRemarksWrite = useDebouncedWrite<string>((_key, value) => {
    onSetFinalRemarks(value);
  });

  useImperativeHandle(handleRef, () => ({
    flushPendingWrites: () => {
      movementWrite.flushAll();
      collectiveWrite.flushAll();
      remarkWrite.flushAll();
      finalRemarksWrite.flushAll();
    },
  }));

  const movements = score?.movements ?? {};
  const collectives = score?.collectives ?? {};
  const errorAt = score?.errorAt ?? {};
  const remarks = score?.remarks ?? {};

  function isLockedFor(enteredBy: 'judge' | 'scribe' | null) {
    return locked || (enteredBy === 'judge' && seatRole === 'scribe');
  }

  return (
    <div className="flex flex-col gap-2.5">
      {test.movements.map((m) => {
        const mark = movements[String(m.num)];
        return (
          <div
            key={m.num}
            className="flex flex-wrap items-center gap-3 rounded-xl border border-[#E9EDEB] bg-white p-[14px_16px]"
          >
            <span className="w-6 flex-none text-[13px] font-bold text-[#7A8781]">{m.num}</span>
            <span className="min-w-[220px] flex-1 text-[13.5px] text-ink-deep">{m.text}</span>

            <MarkStepper
              value={mark?.value ?? null}
              enteredBy={mark?.enteredBy ?? null}
              locked={isLockedFor(mark?.enteredBy ?? null)}
              onChange={(value) => {
                movementWrite.debounced(String(m.num), value);
              }}
            />

            <button
              type="button"
              disabled={locked}
              onClick={() => {
                onToggleError(m.num);
              }}
              aria-pressed={Boolean(errorAt[String(m.num)])}
              aria-label="Toggle error of course"
              className={`grid size-8 flex-none place-items-center rounded-[8px] border text-[15px] disabled:opacity-40 ${
                errorAt[String(m.num)]
                  ? 'border-[#E3B8B8] bg-[#F7E1E1] text-[#B23A3A]'
                  : 'border-[#D9E1DD] bg-white text-[#B4BFB9] hover:border-gold'
              }`}
            >
              ⚠
            </button>

            <RemarkField
              value={remarks[String(m.num)] ?? ''}
              disabled={locked}
              onChange={(text) => {
                remarkWrite.debounced(String(m.num), text);
              }}
            />
          </div>
        );
      })}

      {test.collectives.length > 0 && (
        <div className="mt-2 flex flex-col gap-2.5 rounded-xl border border-[#E9EDEB] bg-white p-[16px_18px]">
          <span className="text-[10px] font-bold tracking-[.12em] text-[#7A8781] uppercase">
            Collective marks
          </span>
          {test.collectives.map((c) => {
            const mark = collectives[c.key];
            return (
              <div key={c.key} className="flex items-center gap-3">
                <span className="min-w-[180px] flex-1 text-[13.5px] text-ink-deep">{c.label}</span>
                <MarkStepper
                  value={mark?.value ?? null}
                  enteredBy={mark?.enteredBy ?? null}
                  locked={isLockedFor(mark?.enteredBy ?? null)}
                  onChange={(value) => {
                    collectiveWrite.debounced(c.key, value);
                  }}
                />
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-2 flex flex-col gap-1.5 rounded-xl border border-[#E9EDEB] bg-white p-[16px_18px]">
        <label htmlFor="final-remarks" className="text-[10px] font-bold tracking-[.12em] text-[#7A8781] uppercase">
          Final remarks
        </label>
        <FinalRemarksField
          initialValue={score?.finalRemarks ?? ''}
          disabled={locked}
          onChange={(text) => {
            finalRemarksWrite.debounced('final', text);
          }}
        />
      </div>
    </div>
  );
}

/**
 * Syncs from the poll unless the field is actively focused — a remote
 * change shouldn't clobber a live keystroke. Adjusts state from a
 * prop-derived comparison during render (React's own documented pattern for
 * this), rather than an effect — plain state instead of a ref for
 * `isFocused` since it needs to be read during that same render-time check.
 */
function useSyncedDraft(value: string) {
  const [draft, setDraft] = useState(value);
  const [isFocused, setIsFocused] = useState(false);
  const [lastValue, setLastValue] = useState(value);
  if (value !== lastValue) {
    setLastValue(value);
    if (!isFocused) setDraft(value);
  }
  return {
    draft,
    setDraft,
    onFocus: () => {
      setIsFocused(true);
    },
    onBlur: () => {
      setIsFocused(false);
    },
  };
}

function RemarkField({
  value,
  disabled,
  onChange,
}: {
  value: string;
  disabled: boolean;
  onChange: (text: string) => void;
}) {
  const { draft, setDraft, onFocus, onBlur } = useSyncedDraft(value);
  return (
    <input
      type="text"
      value={draft}
      disabled={disabled}
      placeholder="Remark"
      onFocus={onFocus}
      onBlur={onBlur}
      onChange={(e) => {
        setDraft(e.target.value);
        onChange(e.target.value);
      }}
      className="min-w-[160px] flex-1 rounded-[8px] border border-[#D9E1DD] px-2.5 py-1.5 text-[12.5px] text-ink-deep outline-none focus-visible:border-gold disabled:bg-[#F1F4F3]"
    />
  );
}

function FinalRemarksField({
  initialValue,
  disabled,
  onChange,
}: {
  initialValue: string;
  disabled: boolean;
  onChange: (text: string) => void;
}) {
  const { draft, setDraft, onFocus, onBlur } = useSyncedDraft(initialValue);
  return (
    <textarea
      id="final-remarks"
      value={draft}
      disabled={disabled}
      rows={3}
      onFocus={onFocus}
      onBlur={onBlur}
      onChange={(e) => {
        setDraft(e.target.value);
        onChange(e.target.value);
      }}
      className="resize-none rounded-[8px] border border-[#D9E1DD] px-2.5 py-2 text-[13px] text-ink-deep outline-none focus-visible:border-gold disabled:bg-[#F1F4F3]"
    />
  );
}
