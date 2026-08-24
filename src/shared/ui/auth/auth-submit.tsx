'use client';

import type { ReactNode } from 'react';
import { ArrowRightIcon, Loader2Icon } from 'lucide-react';
import { Button } from '@/shared/ui/shadcn/button';
import { cn } from '@/shared/lib/utils';

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

  showIcon?: boolean;
  type?: 'submit' | 'button';
  onClick?: () => void;

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
        SUBMIT_VARIANTS[variant],
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
