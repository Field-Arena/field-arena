'use client';

import type { ReactNode } from 'react';
import { Button } from '@/shared/ui/shadcn/button';
import { cn } from '@/shared/lib/utils';
import { useDemoDialogStore } from '@/modules/marketing/store';

export function DemoTrigger({
  children,
  className,
  'aria-label': ariaLabel,
}: {
  children: ReactNode;
  className?: string;
  'aria-label'?: string;
}) {
  const openDialog = useDemoDialogStore((state) => state.openDialog);

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={openDialog}
      aria-label={ariaLabel}
      className={cn(
        'h-auto rounded-none px-0 py-0 text-base font-normal hover:bg-transparent',
        className,
      )}
    >
      {children}
    </Button>
  );
}
