import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';

export function StatusPill({
  tone,
  children,
}: {
  tone: 'success' | 'warn' | 'danger' | 'info';
  children: ReactNode;
}) {
  const tones = {
    success: 'bg-[#E4F1E8] text-[#2E7048] [--dot:#3E8E5A]',
    warn: 'bg-[#F6EAC8] text-[#8A6D14] [--dot:#C9A227]',
    danger: 'bg-alert-bg text-alert-fg [--dot:#B4432F]',
    info: 'bg-mint text-forest [--dot:#5A6B63]',
  } as const;

  return (
    <span
      className={cn(
        'inline-flex h-[19px] flex-none items-center gap-[5px] rounded-full px-2 text-[10px] font-bold tracking-[.04em]',
        tones[tone]
      )}
    >
      <span aria-hidden className="size-[5px] rounded-full bg-[var(--dot)]" />
      {children}
    </span>
  );
}
