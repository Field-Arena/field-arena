import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';

export type StatusTone = 'success' | 'warn' | 'danger' | 'info' | 'neutral';

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
        'inline-flex items-center rounded-xl px-2.5 py-1 text-[11px] font-bold whitespace-nowrap',
        TONE_CLASSES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
