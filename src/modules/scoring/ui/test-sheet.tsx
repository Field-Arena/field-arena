'use client';

import { useImperativeHandle, useState, type Ref } from 'react';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/shadcn/button';
import { Input } from '@/shared/ui/shadcn/input';
import { Label } from '@/shared/ui/shadcn/label';
import { Textarea } from '@/shared/ui/shadcn/textarea';
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

  const movementRow = (m: TestMovement) => {
    const mark = movements[String(m.num)];
    return (
      <div
        key={m.num}
        className="flex flex-wrap items-center gap-3 rounded-xl border border-[#E9EDEB] bg-white p-[14px_16px]"
      >
        <span className="w-6 flex-none text-[13px] font-bold text-[#7A8781]">{m.num}</span>
        <span className="text-ink-deep min-w-[220px] flex-1 text-[13.5px]">{m.text}</span>

        <MarkStepper
          value={mark?.value ?? null}
          enteredBy={mark?.enteredBy ?? null}
          locked={isLockedFor(mark?.enteredBy ?? null)}
          onChange={(value) => {
            movementWrite.debounced(String(m.num), value);
          }}
        />

        <Button
          type="button"
          variant="ghost"
          disabled={locked}
          onClick={() => {
            onToggleError(m.num);
          }}
          aria-pressed={Boolean(errorAt[String(m.num)])}
          aria-label="Toggle error of course"
          className={cn(
            'grid size-8 h-auto flex-none place-items-center rounded-[8px] border px-0 py-0 text-[15px] font-normal hover:bg-transparent disabled:opacity-40',
            errorAt[String(m.num)]
              ? 'border-[#E3B8B8] bg-[#F7E1E1] text-[#B23A3A]'
              : 'hover:border-gold border-[#D9E1DD] bg-white text-[#B4BFB9]',
          )}
        >
          ⚠
        </Button>

        <RemarkField
          value={remarks[String(m.num)] ?? ''}
          disabled={locked}
          onChange={(text) => {
            remarkWrite.debounced(String(m.num), text);
          }}
        />
      </div>
    );
  };

  const collectiveRow = (c: TestCollective) => {
    const mark = collectives[c.key];
    return (
      <div key={c.key} className="flex items-center gap-3">
        <span className="text-ink-deep min-w-[180px] flex-1 text-[13.5px]">{c.label}</span>
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
  };

  return (
    <div className="flex flex-col gap-2.5">
      <details
        open={open}
        onToggle={(e) => {
          setOpen(e.currentTarget.open);
        }}
        className="flex flex-col gap-2.5"
      >
        <summary className="text-ink-deep cursor-pointer list-none rounded-xl border border-[#E9EDEB] bg-white p-[12px_16px] text-[13px] font-semibold marker:hidden">
          {open ? 'Hide' : 'Show'} full test sheet — {test.movements.length} movements
          {test.collectives.length > 0
            ? `, ${String(test.collectives.length)} collective marks`
            : ''}
        </summary>

        {movementGroups
          ? movementGroups.map((group) => (
              <div key={group.section} className="flex flex-col gap-2.5">
                <span className="text-[10px] font-bold tracking-[.12em] text-[#7A8781] uppercase">
                  {group.section}
                </span>
                {group.items.map(movementRow)}
                <div className="pr-1 text-right text-[12px] font-semibold text-[#7A8781]">
                  Section subtotal {subtotalForMovements(markSheet, group.items)} /{' '}
                  {maxForMovements(group.items)}
                </div>
              </div>
            ))
          : test.movements.map(movementRow)}

        {test.collectives.length > 0 && (
          <div className="mt-2 flex flex-col gap-2.5 rounded-xl border border-[#E9EDEB] bg-white p-[16px_18px]">
            <span className="text-[10px] font-bold tracking-[.12em] text-[#7A8781] uppercase">
              Collective marks
            </span>
            {collectiveGroups
              ? collectiveGroups.map((group) => (
                  <div key={group.section} className="flex flex-col gap-2.5">
                    <span className="text-[11px] font-semibold text-[#7A8781]">
                      {group.section}
                    </span>
                    {group.items.map(collectiveRow)}
                    <div className="pr-1 text-right text-[12px] font-semibold text-[#7A8781]">
                      Section subtotal {subtotalForCollectives(markSheet, group.items)} /{' '}
                      {maxForCollectives(group.items)}
                    </div>
                  </div>
                ))
              : test.collectives.map(collectiveRow)}
          </div>
        )}
      </details>

      <div className="mt-2 flex flex-col gap-1.5 rounded-xl border border-[#E9EDEB] bg-white p-[16px_18px]">
        <Label
          htmlFor="final-remarks"
          className="text-[10px] font-bold tracking-[.12em] text-[#7A8781] uppercase"
        >
          Final remarks
        </Label>
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
      placeholder="Remark"
      onFocus={onFocus}
      onBlur={onBlur}
      onChange={(e) => {
        setDraft(e.target.value);
        onChange(e.target.value);
      }}
      className="text-ink-deep focus-visible:border-gold h-auto min-w-[160px] flex-1 rounded-[8px] border border-[#D9E1DD] px-2.5 py-1.5 text-[12.5px] outline-none disabled:bg-[#F1F4F3] disabled:opacity-100"
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
    <Textarea
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
      className="text-ink-deep focus-visible:border-gold resize-none rounded-[8px] border border-[#D9E1DD] px-2.5 py-2 text-[13px] outline-none disabled:bg-[#F1F4F3]"
    />
  );
}
