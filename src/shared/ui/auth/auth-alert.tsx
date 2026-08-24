'use client';

import type { ReactNode } from 'react';
import { CircleAlertIcon, CheckIcon } from 'lucide-react';
import { Alert, AlertDescription } from '@/shared/ui/shadcn/alert';
import { cn } from '@/shared/lib/utils';

export function AuthAlert({ tone, children }: { tone: 'error' | 'success'; children: ReactNode }) {
  const isError = tone === 'error';
  const Icon = isError ? CircleAlertIcon : CheckIcon;

  return (
    <Alert
      role={isError ? 'alert' : 'status'}
      className={cn(
        'grid-cols-[15px_1fr] items-start gap-x-[9px] rounded-xl px-3.5 py-3',
        isError ? 'border-alert-line bg-alert-bg' : 'border-line-mint-2 bg-mint',
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
