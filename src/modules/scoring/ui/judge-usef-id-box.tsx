'use client';

import { useEffect, useRef, useState } from 'react';
import { FaCard, Pill, type PillTone } from '@/shared/ui/organizer/fa-page';
import { useSetMyUsefId } from '@/modules/scoring/hooks/use-scoring-mutations';
import { decideUsefIdSave } from '@/modules/judges/utils/usef-id-save';
import { formatChangedAt } from '@/modules/judges/utils/judge-display';
import type { SeatUsefId } from '@/modules/scoring/types';

const SAVE_DELAY_MS = 800;

type Status = 'idle' | 'saving' | 'saved' | 'error';

const STATUS_PILL: Record<Status, { label: string; tone: PillTone }> = {
  idle: { label: 'not set', tone: 'yellow' },
  saving: { label: 'saving…', tone: 'grey' },
  saved: { label: 'saved', tone: 'green' },
  error: { label: 'not saved, try again', tone: 'red' },
};

/* The judge's USEF ID, at the top of the sheet they are scoring. It saves as they
 * type, never locks, and can be corrected any time: the results export reads the
 * current value, so a fix reaches classes already scored. A scribe sees the
 * judge's ID read-only. */
export function JudgeUsefIdBox({
  classId,
  initial,
  onSaved,
}: {
  classId: string;
  initial: SeatUsefId;
  onSaved?: (usefId: string | null) => void;
}) {
  const [value, setValue] = useState(initial.usefId ?? '');
  const [saved, setSaved] = useState<string | null>(initial.usefId);
  const [updatedAt, setUpdatedAt] = useState(initial.updatedAt);
  const [status, setStatus] = useState<Status>(initial.usefId ? 'saved' : 'idle');
  const [problem, setProblem] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const save = useSetMyUsefId();

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  function commit(typed: string) {
    const decision = decideUsefIdSave(typed, saved);
    if (decision.action === 'invalid') {
      setProblem(decision.message);
      return;
    }
    setProblem(null);
    if (decision.action === 'unchanged') {
      setStatus(saved ? 'saved' : 'idle');
      return;
    }
    setStatus('saving');
    save.mutate(
      { classId, usefId: decision.value },
      {
        onSuccess: (result) => {
          setSaved(result.usefId);
          setUpdatedAt(result.updatedAt);
          setStatus(result.usefId ? 'saved' : 'idle');
          onSaved?.(result.usefId);
        },
        onError: () => {
          setStatus('error');
        },
      },
    );
  }

  function onChange(next: string) {
    setValue(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      commit(next);
    }, SAVE_DELAY_MS);
  }

  function flush() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    commit(value);
  }

  const changedAt = formatChangedAt(updatedAt);
  const pill = STATUS_PILL[status];

  if (!initial.canEdit) {
    return (
      <FaCard tone="default" className="p-[14px_18px]">
        <p className="text-[12px] font-bold tracking-[.06em] text-[#3F4F48] uppercase">
          Judge&apos;s USEF ID{initial.judgeName ? ` · ${initial.judgeName}` : ''}
        </p>
        <p className="mt-1 text-[16px] font-bold text-[#0D2C23]">
          {initial.usefId ?? <span className="text-[13px] font-semibold text-[#5A6B63]">not entered yet</span>}
        </p>
        <p className="mt-1 text-[12.5px] font-semibold text-[#5A6B63]">
          Only the judge can change this. You can see it here so you know it is on the results.
        </p>
      </FaCard>
    );
  }

  return (
    <FaCard tone="live" className="p-[14px_18px]">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <label
              htmlFor="my-usef-id"
              className="text-[12px] font-bold tracking-[.06em] text-[#3F4F48] uppercase"
            >
              My USEF ID (judge)
            </label>
            <Pill tone={pill.tone}>{pill.label}</Pill>
          </div>
          <input
            id="my-usef-id"
            inputMode="numeric"
            autoComplete="off"
            className="text-ink-deep w-[240px] rounded-[10px] border-2 border-[#C9D3CE] bg-white px-3 py-2 text-[14px] outline-none focus-visible:border-[#1A5B3C]"
            placeholder="Numbers only"
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
            }}
            onBlur={flush}
          />
        </div>
        <p className="min-w-[220px] flex-1 text-[12.5px] font-semibold text-[#5A6B63]">
          Goes on every results row you judge. You can change it any time. Fixing it updates the
          whole show&apos;s results, including classes you already scored.
          {changedAt ? ` Last changed ${changedAt}.` : ''}
        </p>
      </div>
      {problem && (
        <p role="alert" className="mt-2 text-[13px] font-semibold text-[#98341F]">
          {problem}
        </p>
      )}
    </FaCard>
  );
}
