import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';

export type StatusTone = 'success' | 'warn' | 'danger' | 'info' | 'neutral';

/**
 * A state badge — entry status, payment state, booking state, lead stage.
 *
 * Two rules hold here. Status colours are reserved: they mean state and are never
 * reused to distinguish one series from another. And the badge always renders its
 * label, so state is never communicated by colour alone — which matters both for
 * colour-vision deficiency and for the greyscale printouts show secretaries
 * actually work from at a ring.
 *
 * The tone → colour mapping comes from the legacy pill styles in
 * public/assets/styles.css, which paired a saturated text colour with its own
 * pale background. Those pairs are now Tailwind tokens (see the status palette in
 * globals.css) rather than repeated hex values.
 */
const TONE_CLASSES: Record<StatusTone, string> = {
  success: 'bg-status-success-bg text-status-success',
  warn: 'bg-status-warn-bg text-status-warn',
  danger: 'bg-status-danger-bg text-status-danger',
  info: 'bg-status-info-bg text-status-info',
  neutral: 'bg-hunter-pale text-hunter-deep',
};

export function StatusBadge({
  tone = 'neutral',
  children,
  className,
}: {
  tone?: StatusTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-xl px-2.5 py-1 text-[11px] font-bold',
        TONE_CLASSES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
