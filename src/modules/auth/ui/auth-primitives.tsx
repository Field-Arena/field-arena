'use client';

import type { ReactNode } from 'react';
import { ArrowRightIcon, CircleAlertIcon, CheckIcon, Loader2Icon } from 'lucide-react';
import { Button } from '@/shared/ui/shadcn/button';
import { Alert, AlertDescription } from '@/shared/ui/shadcn/alert';
import { cn } from '@/shared/lib/utils';
import { passwordStrength, passwordStrengthLabel } from '../utils';

/** The gold primary action used by every auth screen. */
export function AuthSubmit({
  children,
  pending,
  pendingLabel,
}: {
  children: ReactNode;
  pending?: boolean;
  pendingLabel?: string;
}) {
  return (
    <Button
      type="submit"
      disabled={pending}
      className="h-auto w-full gap-2.5 rounded-[10px] bg-gold px-6 py-[17px] text-[15px] font-bold text-forest transition-all duration-150 ease-out hover:-translate-y-0.5 hover:bg-gold-light hover:shadow-[0_12px_34px_rgba(201,162,39,.28)] disabled:translate-y-0 disabled:opacity-70 disabled:shadow-none"
    >
      {pending ? (pendingLabel ?? 'Working…') : children}
      {pending ? (
        <Loader2Icon className="size-[15px] animate-spin" aria-hidden />
      ) : (
        <ArrowRightIcon className="size-[15px]" aria-hidden />
      )}
    </Button>
  );
}

/**
 * Inline status, in the design's own two tones.
 *
 * Errors render here rather than as a toast: the message belongs beside the
 * field that caused it, not in a corner the user has to look away to read.
 */
export function AuthAlert({ tone, children }: { tone: 'error' | 'success'; children: ReactNode }) {
  const isError = tone === 'error';
  const Icon = isError ? CircleAlertIcon : CheckIcon;

  return (
    <Alert
      role={isError ? 'alert' : 'status'}
      className={cn(
        'grid-cols-[15px_1fr] items-start gap-x-[9px] rounded-[10px] px-3.5 py-3',
        isError ? 'border-alert-line bg-alert-bg' : 'border-line-mint-2 bg-mint'
      )}
    >
      <Icon
        className={cn('mt-0.5 size-[15px]', isError ? 'text-[#B4432F]' : 'text-forest')}
        aria-hidden
      />
      <AlertDescription
        className={cn('text-[13.5px] leading-normal', isError ? 'text-alert-fg' : 'text-forest')}
      >
        {children}
      </AlertDescription>
    </Alert>
  );
}

/**
 * The three-segment strength meter from the sign-up design.
 *
 * Colour comes from the score, not the segment index — all filled bars share the
 * score's colour, so the meter reads as one verdict rather than a gradient.
 */
const STRENGTH_COLOURS = ['#C24A3A', '#D9A83C', '#3E8E5A'] as const;

export function PasswordStrengthMeter({ password }: { password: string }) {
  const score = passwordStrength(password);
  const filled = score > 0 ? STRENGTH_COLOURS[score - 1] : undefined;

  return (
    <div className="mt-3 flex items-center gap-3">
      <div className="flex flex-1 gap-[5px]" aria-hidden>
        {[1, 2, 3].map((segment) => (
          <span
            key={segment}
            className="h-[3px] flex-1 rounded-sm transition-colors"
            style={{ background: score >= segment && filled ? filled : '#E2E8E4' }}
          />
        ))}
      </div>
      <span
        aria-live="polite"
        className="min-w-[74px] text-right text-[11.5px] font-semibold tracking-[.04em] text-fa-muted-2"
      >
        {passwordStrengthLabel(password)}
      </span>
    </div>
  );
}
