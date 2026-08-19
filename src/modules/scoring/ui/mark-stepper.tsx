'use client';

import { useState } from 'react';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/shadcn/button';
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

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="relative">
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
          className={cn(
            'h-auto px-0 py-0',
            'text-ink-deep h-9 w-16 rounded-[8px] border border-[#D9E1DD] text-center text-[15px] font-semibold',
            'focus-visible:border-gold outline-none',
            'disabled:bg-[#F1F4F3] disabled:text-[#8B9591] disabled:opacity-100',
          )}
        />
      </span>

      <span className="flex flex-col gap-0.5">
        <Button
          type="button"
          variant="ghost"
          disabled={locked}
          onClick={() => {
            step(MARK_STEP);
          }}
          aria-label="Increase mark"
          className="text-ink-deep hover:border-gold grid size-5 h-auto place-items-center rounded-[4px] border border-[#D9E1DD] px-0 py-0 text-[10px] leading-none font-normal hover:bg-transparent disabled:opacity-40"
        >
          ▲
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={locked}
          onClick={() => {
            step(-MARK_STEP);
          }}
          aria-label="Decrease mark"
          className="text-ink-deep hover:border-gold grid size-5 h-auto place-items-center rounded-[4px] border border-[#D9E1DD] px-0 py-0 text-[10px] leading-none font-normal hover:bg-transparent disabled:opacity-40"
        >
          ▼
        </Button>
      </span>

      {enteredBy && (
        <span className="rounded-full bg-[#EAF1EC] px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-[#3F5C4C] uppercase">
          {enteredBy}
        </span>
      )}
    </span>
  );
}
