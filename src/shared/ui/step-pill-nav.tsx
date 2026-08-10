'use client';

import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';

export interface StepPillNavStep {
  key: string;
  label: string;
  title: string;
  sub: string;
}

/**
 * Restyled port of legacy's `.steps`/`.step-pill`/`.toolbar`/`.navbtn` chrome
 * (public/views/preview-signup-pages.html, preview-rider-demo.html — both
 * pages share byte-for-byte identical CSS for this) onto this app's own
 * design tokens (forest/gold/paper) instead of legacy's inline hex palette.
 *
 * Genuinely cross-module UI — the SuperAdmin Signup Flow Preview and the
 * rider module's demo walkthrough both use it — so it lives in shared/ui/
 * rather than either module's own ui/ folder, same reasoning as
 * shared/ui/auth/* being promoted out of the auth module (see
 * .claude/rules/folder-structure.md: a module must not reach into another
 * module's internals).
 */
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
    <div className="flex min-h-dvh flex-col bg-cream font-[family-name:var(--font-ar)]">
      <div className="flex flex-none gap-1.5 overflow-x-auto border-b border-line bg-white px-4 py-2.5 sm:px-6">
        {steps.map((s, i) => (
          <button
            key={s.key}
            type="button"
            onClick={() => { onJump(i); }}
            className={cn(
              'flex-none rounded-full border px-3.5 py-[7px] text-xs font-semibold whitespace-nowrap transition-colors',
              i === activeIndex
                ? 'border-forest bg-forest text-white'
                : i < activeIndex
                  ? 'border-line bg-cream text-forest hover:bg-mint'
                  : 'border-line bg-cream text-fa-muted hover:bg-mint'
            )}
          >
            {i + 1}. {s.label}
          </button>
        ))}
      </div>

      <div className="flex flex-none flex-wrap items-center gap-3 border-b border-line bg-mint px-4 py-2.5 sm:px-6">
        <div className="min-w-[220px] flex-1">
          {step && (
            <>
              <h2 className="font-[family-name:var(--font-nr)] text-[15px] font-medium text-forest">
                {activeIndex + 1}. {step.title}
              </h2>
              <p className="mt-0.5 text-xs text-fa-muted">{step.sub}</p>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={onPrev}
          disabled={activeIndex === 0}
          className="rounded-lg border border-forest bg-white px-4 py-2 text-[12.5px] font-bold text-forest transition-colors hover:bg-mint disabled:cursor-default disabled:border-line disabled:text-fa-muted disabled:hover:bg-white"
        >
          ← Prev
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={activeIndex === steps.length - 1}
          className="rounded-lg bg-forest px-4 py-2 text-[12.5px] font-bold text-white transition-colors hover:bg-forest/90 disabled:cursor-default disabled:bg-line disabled:text-fa-muted"
        >
          Next →
        </button>
      </div>

      <div className="flex-1 px-4 py-8 sm:px-6">{children}</div>
    </div>
  );
}
