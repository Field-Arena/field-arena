'use client';

import { useId, type ReactNode } from 'react';
import { ArrowRightIcon, CircleAlertIcon, CheckIcon, Loader2Icon } from 'lucide-react';
import { Button } from '@/shared/ui/shadcn/button';
import { Alert, AlertDescription } from '@/shared/ui/shadcn/alert';
import { cn } from '@/shared/lib/utils';
import { passwordStrength, passwordStrengthLabel } from '@/shared/lib/password-strength';

/**
 * The primary action on every auth screen, in the design's three treatments.
 *
 * They are not interchangeable. Sign-up's button carries the arrow and lifts on
 * hover because it advances a flow; sign-in's is the end of one, so it only
 * changes fill. The reset action is deliberately forest rather than gold — it
 * sits above the "or sign in another way" alternative and must not out-shout it.
 */
const SUBMIT_VARIANTS = {
  gold:
    'bg-gold text-forest hover:-translate-y-0.5 hover:bg-gold-light ' +
    'hover:shadow-[0_12px_34px_rgba(201,162,39,.28)] disabled:translate-y-0 disabled:shadow-none',
  'gold-flat': 'bg-gold text-forest hover:bg-gold-light',
  forest: 'bg-ink-deep text-paper hover:bg-forest',
} as const;

export function AuthSubmit({
  children,
  pending,
  pendingLabel,
  variant = 'gold',
  showIcon = variant === 'gold',
  type = 'submit',
  onClick,
  disabled,
}: {
  children: ReactNode;
  pending?: boolean;
  pendingLabel?: string;
  variant?: keyof typeof SUBMIT_VARIANTS;
  /** The trailing arrow. On by default only where the design draws one. */
  showIcon?: boolean;
  type?: 'submit' | 'button';
  onClick?: () => void;
  /** An extra, caller-decided condition (e.g. a required field still empty) — combined with `pending`, not a replacement for it. */
  disabled?: boolean;
}) {
  return (
    <Button
      type={type}
      onClick={onClick}
      disabled={(pending ?? false) || (disabled ?? false)}
      className={cn(
        'h-auto w-full gap-2.5 rounded-xl px-6 py-[17px] text-[15px] font-bold',
        'transition-all duration-150 ease-out disabled:opacity-70',
        SUBMIT_VARIANTS[variant]
      )}
    >
      {pending ? (pendingLabel ?? 'Working…') : children}
      {pending ? (
        <Loader2Icon className="size-[15px] animate-spin" aria-hidden />
      ) : (
        showIcon && <ArrowRightIcon className="size-[15px]" aria-hidden />
      )}
    </Button>
  );
}

/**
 * The design's "Keep me signed in on this device" control.
 *
 * A real checkbox input rather than a styled button: the design draws a button,
 * but a checkbox is what screen readers and password managers expect here, and
 * the visual result is identical.
 */
export function AuthCheckbox({
  checked,
  onChange,
  children,
  id,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  children: ReactNode;
  id?: string;
}) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;

  return (
    <div className="flex items-center gap-2.5">
      <span className="relative grid size-[18px] flex-none place-items-center">
        <input
          id={fieldId}
          type="checkbox"
          checked={checked}
          onChange={(event) => {
            onChange(event.target.checked);
          }}
          className={cn(
            'peer size-[18px] cursor-pointer appearance-none rounded-[5px] border transition-colors',
            checked ? 'border-gold bg-gold' : 'border-field bg-white'
          )}
        />
        <CheckIcon
          aria-hidden
          className={cn(
            'pointer-events-none absolute size-[11px] text-forest [stroke-width:3.4]',
            checked ? 'opacity-100' : 'opacity-0'
          )}
        />
      </span>
      <label htmlFor={fieldId} className="cursor-pointer text-[13.5px] text-fa-muted">
        {children}
      </label>
    </div>
  );
}

/** The rule-flanked caption separating the reset action from its alternative. */
export function AuthDivider({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full items-center gap-3.5">
      <span aria-hidden className="h-px flex-1 bg-line" />
      <span className="whitespace-nowrap text-[13px] text-fa-muted-2">{children}</span>
      <span aria-hidden className="h-px flex-1 bg-line" />
    </div>
  );
}

/**
 * The gold-ruled eyebrow above each panel's heading. The reset panel is centred,
 * so it is ruled on both sides; the sign-in panel is left-aligned and ruled once.
 */
export function AuthEyebrow({ children, centred }: { children: ReactNode; centred?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span aria-hidden className="h-[3px] w-[26px] bg-gold" />
      <span className="text-[10.5px] font-bold uppercase tracking-[.18em] text-forest">
        {children}
      </span>
      {centred && <span aria-hidden className="h-[3px] w-[26px] bg-gold" />}
    </div>
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
        'grid-cols-[15px_1fr] items-start gap-x-[9px] rounded-xl px-3.5 py-3',
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
