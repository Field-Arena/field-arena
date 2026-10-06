'use client';

import { useState } from 'react';
import { cn } from '@/shared/lib/utils';
import { Input } from '@/shared/ui/shadcn/input';
import { MARK_DEFAULT, MARK_MAX, MARK_MIN, MARK_STEP } from '@/modules/scoring/constants';
import { clampMark } from '@/modules/scoring/scoring-engine';

export function MarkStepper({
  value,
  enteredBy,
  locked,
  onChange,
}: {
  value: number | null;
  enteredBy: 'judge' | 'scribe' | null;
  locked: boolean;
  onChange: (value: number) => void;
}) {
  const [draft, setDraft] = useState(value === null ? '' : String(value));

  const [lastValue, setLastValue] = useState(value);
  if (value !== lastValue) {
    setLastValue(value);
    setDraft(value === null ? '' : String(value));
  }

  function step(delta: number) {
    if (locked) return;
    const base = value ?? MARK_DEFAULT;
    onChange(clampMark(base + delta));
  }

  function commit(raw: string) {
    if (locked) return;
    const n = Number(raw);
    if (raw.trim() === '' || Number.isNaN(n)) {
      setDraft(value === null ? '' : String(value));
      return;
    }
    onChange(clampMark(n));
  }

  const btn =
    'grid h-8 w-8 place-items-center border-0 bg-transparent text-[16px] font-medium text-[var(--fa-ink-2)] transition hover:bg-[var(--fa-surface-2)] hover:text-[var(--fa-ink)] disabled:cursor-not-allowed disabled:opacity-40';

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-flex items-center overflow-hidden rounded-[9px] border border-[var(--fa-line)] bg-white">
        <button
          type="button"
          disabled={locked}
          onClick={() => {
            step(-MARK_STEP);
          }}
          aria-label="Decrease mark"
          className={btn}
        >
          −
        </button>
        <Input
          type="text"
          inputMode="decimal"
          value={draft}
          disabled={locked}
          onChange={(e) => {
            setDraft(e.target.value);
          }}
          onBlur={(e) => {
            commit(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowUp') {
              e.preventDefault();
              step(MARK_STEP);
            } else if (e.key === 'ArrowDown') {
              e.preventDefault();
              step(-MARK_STEP);
            } else if (e.key === 'Enter') {
              commit(e.currentTarget.value);
              e.currentTarget.blur();
            }
          }}
          onWheel={(e) => {
            if (locked) return;
            e.preventDefault();
            step(e.deltaY < 0 ? MARK_STEP : -MARK_STEP);
          }}
          min={MARK_MIN}
          max={MARK_MAX}
          step={MARK_STEP}
          aria-label="Mark"
          className={cn(
            'h-8 w-12 rounded-none border-0 border-x border-[var(--fa-line-soft)] px-0 py-0 shadow-none',
            'text-center text-[14px] font-bold text-[var(--fa-ink)] outline-none focus-visible:ring-0',
            'disabled:bg-[var(--fa-surface-2)] disabled:text-[var(--fa-ink-3)] disabled:opacity-100',
          )}
        />
        <button
          type="button"
          disabled={locked}
          onClick={() => {
            step(MARK_STEP);
          }}
          aria-label="Increase mark"
          className={btn}
        >
          +
        </button>
      </span>

      {/* Fixed-width slot so steppers line up whether or not a mark is tagged. */}
      <span className="inline-flex w-[46px] justify-start">
        {enteredBy && (
          <span className="rounded-full bg-[var(--fa-brand-tint)] px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-[var(--fa-brand)] uppercase">
            {enteredBy}
          </span>
        )}
      </span>
    </span>
  );
}
