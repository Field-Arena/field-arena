'use client';

import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';

export interface StepPillNavStep {
  key: string;
  label: string;
  title: string;
  sub: string;
}

export function StepPillNav({
  steps,
  activeIndex,
  onJump,
  onPrev,
  onNext,
  children,
}: {
  steps: StepPillNavStep[];
  activeIndex: number;
  onJump: (index: number) => void;
  onPrev: () => void;
  onNext: () => void;
  children: ReactNode;
}) {
  const step = steps[activeIndex];

  return (
    <div className="bg-cream flex min-h-dvh flex-col font-[family-name:var(--font-ar)]">
      <div className="border-line flex flex-none gap-1.5 overflow-x-auto border-b bg-white px-4 py-2.5 sm:px-6">
        {steps.map((s, i) => (
          <button
            key={s.key}
            type="button"
            onClick={() => {
              onJump(i);
            }}
            className={cn(
              'flex-none rounded-full border px-3.5 py-[7px] text-xs font-semibold whitespace-nowrap transition-colors',
              i === activeIndex
                ? 'border-forest bg-forest text-white'
                : i < activeIndex
                  ? 'border-line bg-cream text-forest hover:bg-mint'
                  : 'border-line bg-cream text-fa-muted hover:bg-mint',
            )}
          >
            {i + 1}. {s.label}
          </button>
        ))}
      </div>

      <div className="border-line bg-mint flex flex-none flex-wrap items-center gap-3 border-b px-4 py-2.5 sm:px-6">
        <div className="min-w-[220px] flex-1">
          {step && (
            <>
              <h2 className="text-forest font-[family-name:var(--font-nr)] text-[15px] font-medium">
                {activeIndex + 1}. {step.title}
              </h2>
              <p className="text-fa-muted mt-0.5 text-xs">{step.sub}</p>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={onPrev}
          disabled={activeIndex === 0}
          className="border-forest text-forest hover:bg-mint disabled:border-line disabled:text-fa-muted rounded-lg border bg-white px-4 py-2 text-[12.5px] font-bold transition-colors disabled:cursor-default disabled:hover:bg-white"
        >
          ← Prev
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={activeIndex === steps.length - 1}
          className="bg-forest hover:bg-forest/90 disabled:bg-line disabled:text-fa-muted rounded-lg px-4 py-2 text-[12.5px] font-bold text-white transition-colors disabled:cursor-default"
        >
          Next →
        </button>
      </div>

      <div className="flex-1 px-4 py-8 sm:px-6">{children}</div>
    </div>
  );
}
