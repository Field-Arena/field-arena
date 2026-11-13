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
    success: 'bg-[#EAF5EF] text-[#15794F] [--dot:#146A47]',
    warn: 'bg-[#FDF2E3] text-[#B45309] [--dot:#146A47]',
    danger: 'bg-alert-bg text-alert-fg [--dot:#B42318]',
    info: 'bg-[#EAF5EF] text-[#101828] [--dot:#475467]',
  } as const;

  return (
    <span
      className={cn(
        'inline-flex h-[19px] flex-none items-center gap-[5px] rounded-full px-2 text-[10px] font-bold tracking-[.04em]',
        tones[tone],
      )}
    >
      <span aria-hidden className="size-[5px] rounded-full bg-[var(--dot)]" />
      {children}
    </span>
  );
}
