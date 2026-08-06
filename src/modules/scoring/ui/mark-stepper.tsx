'use client';

import { useState } from 'react';
import { cn } from '@/shared/lib/utils';
import { MARK_DEFAULT, MARK_MAX, MARK_MIN, MARK_STEP } from '../constants';
import { clampMark } from '../scoring-engine';

/**
 * ▲▼ / scroll-wheel / arrow-key / type-in mark entry, ported from
 * showrunner-scoring.html's `markStepperHtml`. A blank mark defaults to 6
 * the first time it's touched (`MARK_DEFAULT`), not 0 — a judge nudging a
 * fresh mark up or down from nothing should land near where dressage marks
 * actually cluster.
 */
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
  // Adjusting state from a prop change during render (not an effect) — React's
  // own documented pattern for this, since the poll updates `value` and the
  // draft text should follow it unless the field is mid-edit.
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

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="relative">
        <input
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
          className={cn(
            'h-9 w-16 rounded-[8px] border border-[#D9E1DD] text-center text-[15px] font-semibold text-ink-deep',
            'outline-none focus-visible:border-gold',
            locked && 'bg-[#F1F4F3] text-[#8B9591]'
          )}
        />
      </span>

      <span className="flex flex-col gap-0.5">
        <button
          type="button"
          disabled={locked}
          onClick={() => {
            step(MARK_STEP);
          }}
          aria-label="Increase mark"
          className="grid size-5 place-items-center rounded-[4px] border border-[#D9E1DD] text-[10px] leading-none text-ink-deep hover:border-gold disabled:opacity-40"
        >
          ▲
        </button>
        <button
          type="button"
          disabled={locked}
          onClick={() => {
            step(-MARK_STEP);
          }}
          aria-label="Decrease mark"
          className="grid size-5 place-items-center rounded-[4px] border border-[#D9E1DD] text-[10px] leading-none text-ink-deep hover:border-gold disabled:opacity-40"
        >
          ▼
        </button>
      </span>

      {enteredBy && (
        <span className="rounded-full bg-[#EAF1EC] px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-[#3F5C4C] uppercase">
          {enteredBy}
        </span>
      )}
    </span>
  );
}
