'use client';

import { type ReactNode, useImperativeHandle, useState, type Ref } from 'react';
import { cn } from '@/shared/lib/utils';
import { Input } from '@/shared/ui/shadcn/input';
import { useDebouncedWrite } from '@/modules/scoring/hooks/use-debounced-write';
import { REMARK_DEBOUNCE_MS } from '@/modules/scoring/constants';
import { MarkStepper } from '@/modules/scoring/ui/mark-stepper';
import type {
  ScoreRow,
  Sheet,
  TestCollective,
  TestDefinition,
  TestMovement,
} from '@/modules/scoring/types';
import {
  maxForCollectives,
  maxForMovements,
  subtotalForCollectives,
  subtotalForMovements,
} from '@/modules/scoring/scoring-engine';

export interface TestSheetHandle {
  flushPendingWrites: () => void;
}

interface SectionGroup<T> {
  section: string;
  items: T[];
}

/** Group items by their `section`, preserving first-appearance order. Returns
 *  null when no item carries a section (legacy flat tests render unchanged). */
function groupBySection<T extends { section?: string }>(items: T[]): SectionGroup<T>[] | null {
  if (!items.some((item) => item.section)) return null;
  const groups: SectionGroup<T>[] = [];
  const indexBySection = new Map<string, number>();
  for (const item of items) {
    const section = item.section ?? '';
    const existing = indexBySection.get(section);
    if (existing === undefined) {
      indexBySection.set(section, groups.length);
      groups.push({ section, items: [item] });
    } else {
      groups[existing]?.items.push(item);
    }
  }
  return groups;
}

export function TestSheet({
  test,
  score,
  seatRole,
  locked,
  defaultCollapsed = false,
  deductions,
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
  defaultCollapsed?: boolean;
  /** Rendered as the sheet's Deductions section, between collectives and remarks. */
  deductions?: ReactNode;
  onSetMark: (movementNum: number, value: number) => void;
  onSetCollective: (key: string, value: number) => void;
  onToggleError: (movementNum: number) => void;
  onSetRemark: (movementNum: number, text: string) => void;
  onSetFinalRemarks: (text: string) => void;
  handleRef?: Ref<TestSheetHandle>;
}) {
  const [open, setOpen] = useState(!defaultCollapsed);
  const movementWrite = useDebouncedWrite<number>((key, value) => {
    onSetMark(Number(key), value);
  });
  const collectiveWrite = useDebouncedWrite<number>((key, value) => {
    onSetCollective(key, value);
  });
  const remarkWrite = useDebouncedWrite<string>((key, value) => {
    onSetRemark(Number(key), value);
  }, REMARK_DEBOUNCE_MS);
  const finalRemarksWrite = useDebouncedWrite<string>((_key, value) => {
    onSetFinalRemarks(value);
  }, REMARK_DEBOUNCE_MS);

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

  const movementGroups = groupBySection(test.movements);
  const collectiveGroups = groupBySection(test.collectives);

  const movementMarks: Record<string, number | null> = {};
  for (const m of test.movements)
    movementMarks[String(m.num)] = movements[String(m.num)]?.value ?? null;
  const collectiveMarks: Record<string, number | null> = {};
  for (const c of test.collectives) collectiveMarks[c.key] = collectives[c.key]?.value ?? null;
  const markSheet: Sheet = {
    movements: movementMarks,
    collectives: collectiveMarks,
    errors: score?.errors ?? 0,
    remarks,
    finalRemarks: score?.finalRemarks ?? '',
    submitted: score?.submitted ?? false,
  };

  const ROW = 'flex flex-wrap items-center gap-3 border-b border-[var(--fa-line-soft)] px-5 py-2.5';
  const SECTION =
    'flex items-center justify-between gap-3 border-b border-[var(--fa-line-soft)] bg-[var(--fa-surface-2)] px-5 py-2 text-[10.5px] font-bold tracking-[.08em] text-[var(--fa-ink-3)] uppercase';
  const lineTotal = (value: number | null | undefined, coef: number) =>
    value === null || value === undefined ? '—' : (value * coef).toFixed(1);
  const Coef = ({ coef }: { coef: number }) =>
    coef > 1 ? (
      <span className="rounded-[5px] bg-[var(--fa-violet-tint)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--fa-violet)]">
        ×{coef}
      </span>
    ) : null;

  const movementRow = (m: TestMovement) => {
    const mark = movements[String(m.num)];
    const lockedHere = isLockedFor(mark?.enteredBy ?? null);
    return (
      <div key={m.num} className={ROW}>
        <span className="grid size-[22px] flex-none place-items-center rounded-[6px] border border-[var(--fa-line)] bg-[var(--fa-surface-2)] text-[11px] font-bold text-[var(--fa-ink-2)]">
          {m.num}
        </span>
        <span className="w-[220px] flex-none text-[13px] font-semibold text-[var(--fa-ink)]">
          {m.text}
        </span>

        <RemarkField
          value={remarks[String(m.num)] ?? ''}
          disabled={locked}
          onChange={(text) => {
            remarkWrite.debounced(String(m.num), text);
          }}
        />

        <Coef coef={m.coef} />

        {/* The error flag follows the movement it sits on: legacy hid this
            control entirely on a judge-owned mark (showrunner-scoring.html:1273,
            `lockedForScribe ? '' : errToggle`). Errors subtract from the score
            and eliminate at three, so a scribe toggling one on a judge's
            movement changes the judge's result without touching a mark.
            Gating on `locked` alone missed that. */}
        <button
          type="button"
          disabled={lockedHere}
          onClick={() => {
            onToggleError(m.num);
          }}
          aria-pressed={Boolean(errorAt[String(m.num)])}
          aria-label="Toggle error of course"
          title="Error of course at this movement"
          className={cn(
            'grid size-8 flex-none place-items-center rounded-[8px] border text-[14px] transition disabled:opacity-40',
            errorAt[String(m.num)]
              ? 'border-[#FBCFC9] bg-[var(--fa-red-tint)] text-[var(--fa-red)]'
              : 'border-[var(--fa-line)] bg-white text-[var(--fa-ink-3)] hover:border-[#D6DBE1]',
          )}
        >
          ⚠
        </button>

        <MarkStepper
          value={mark?.value ?? null}
          enteredBy={mark?.enteredBy ?? null}
          locked={lockedHere}
          onChange={(value) => {
            movementWrite.debounced(String(m.num), value);
          }}
        />
        <span className="w-12 flex-none text-right text-[13px] font-semibold text-[var(--fa-ink-2)] tabular-nums">
          {lineTotal(mark?.value, m.coef)}
        </span>
      </div>
    );
  };

  const collectiveRow = (c: TestCollective) => {
    const mark = collectives[c.key];
    return (
      <div key={c.key} className={ROW}>
        <span className="w-[22px] flex-none" />
        <span className="w-[220px] flex-none text-[13px] font-semibold text-[var(--fa-ink)]">
          {c.label}
        </span>
        <span className="flex-1" />
        <Coef coef={c.coef} />
        {/* Movement rows carry the error-of-course toggle here. */}
        <span className="size-8 flex-none" aria-hidden />
        <MarkStepper
          value={mark?.value ?? null}
          enteredBy={mark?.enteredBy ?? null}
          locked={isLockedFor(mark?.enteredBy ?? null)}
          onChange={(value) => {
            collectiveWrite.debounced(c.key, value);
          }}
        />
        <span className="w-12 flex-none text-right text-[13px] font-semibold text-[var(--fa-ink-2)] tabular-nums">
          {lineTotal(mark?.value, c.coef)}
        </span>
      </div>
    );
  };

  const subtotal = (text: string) => (
    <div className="border-b border-[var(--fa-line-soft)] px-5 py-1.5 text-right text-[11.5px] font-semibold text-[var(--fa-ink-3)]">
      {text}
    </div>
  );

  return (
    <div>
      <div className={SECTION}>
        <span>
          Movements · {test.movements.length}
          {test.collectives.length > 0
            ? ` + ${String(test.collectives.length)} collective marks`
            : ''}
        </span>
        <button
          type="button"
          className="border-0 bg-transparent text-[11px] font-semibold tracking-normal text-[var(--fa-brand)] normal-case hover:underline"
          aria-expanded={open}
          onClick={() => {
            setOpen((v) => !v);
          }}
        >
          {open ? 'Hide full test sheet' : 'Show full test sheet'}
        </button>
      </div>

      {open && (
        <>
          {movementGroups
            ? movementGroups.map((group) => (
                <div key={group.section}>
                  <div className={SECTION}>{group.section}</div>
                  {group.items.map(movementRow)}
                  {subtotal(
                    `Section subtotal ${String(subtotalForMovements(markSheet, group.items))} / ${String(maxForMovements(group.items))}`,
                  )}
                </div>
              ))
            : test.movements.map(movementRow)}

          {test.collectives.length > 0 && (
            <>
              <div className={SECTION}>Collective marks</div>
              {collectiveGroups
                ? collectiveGroups.map((group) => (
                    <div key={group.section}>
                      <div className="px-5 pt-2 text-[11px] font-semibold text-[var(--fa-ink-3)]">
                        {group.section}
                      </div>
                      {group.items.map(collectiveRow)}
                      {subtotal(
                        `Section subtotal ${String(subtotalForCollectives(markSheet, group.items))} / ${String(maxForCollectives(group.items))}`,
                      )}
                    </div>
                  ))
                : test.collectives.map(collectiveRow)}
            </>
          )}
        </>
      )}

      {deductions && (
        <>
          <div className={SECTION}>Deductions</div>
          <div className="border-b border-[var(--fa-line-soft)] px-5 py-3">{deductions}</div>
        </>
      )}

      <div className={SECTION}>
        <label htmlFor="final-remarks">Final remarks</label>
      </div>
      <div className="flex flex-col gap-1.5 px-5 py-3">
        <span className="text-[12px] text-[var(--fa-ink-3)]">
          Overall comment for the test — appears on the rider&apos;s scoresheet.
        </span>
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
    <Input
      type="text"
      value={draft}
      disabled={disabled}
      placeholder="Remark for this movement"
      onFocus={onFocus}
      onBlur={onBlur}
      onChange={(e) => {
        setDraft(e.target.value);
        onChange(e.target.value);
      }}
      className="h-8 min-w-[160px] flex-1 rounded-[8px] border border-[var(--fa-line)] px-2.5 py-1 text-[12.5px] text-[var(--fa-ink)] italic shadow-none outline-none placeholder:text-[var(--fa-ink-3)] focus-visible:border-[#9FD3BA] focus-visible:not-italic disabled:bg-[var(--fa-surface-2)] disabled:opacity-100"
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
      className="resize-y rounded-[10px] border border-[var(--fa-line)] px-3 py-2.5 text-[13px] text-[var(--fa-ink)] outline-none focus-visible:border-[#9FD3BA] focus-visible:shadow-[0_0_0_3px_var(--fa-brand-tint)] disabled:bg-[var(--fa-surface-2)]"
    />
  );
}
