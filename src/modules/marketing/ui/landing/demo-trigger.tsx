'use client';

import type { ReactNode } from 'react';
import { Button } from '@/shared/ui/shadcn/button';
import { cn } from '@/shared/lib/utils';
import { useDemoDialogStore } from '@/modules/marketing/store';

/**
 * Opens the demo dialog.
 *
 * A button, not a link: the dialog is not a destination, and making it one meant
 * a navigation that remounted the dialog mid-submit (see the store). Every
 * "Book a demo" across the site renders this, which keeps the sections that use
 * it server components — only the trigger itself ships.
 *
 * `variant="ghost"` plus the resets below give this a blank slate — every call
 * site supplies its own full look (background, padding, radius, type) via
 * `className`, which wins over these defaults through `cn`'s tailwind-merge.
 */
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
        className
      )}
    >
      {children}
    </Button>
  );
}
