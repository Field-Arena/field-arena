'use client';

import type { ReactNode } from 'react';
import { useDemoDialogStore } from '../../store';

/**
 * Opens the demo dialog.
 *
 * A button, not a link: the dialog is not a destination, and making it one meant
 * a navigation that remounted the dialog mid-submit (see the store). Every
 * "Book a demo" across the site renders this, which keeps the sections that use
 * it server components — only the trigger itself ships.
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
    <button type="button" onClick={openDialog} className={className} aria-label={ariaLabel}>
      {children}
    </button>
  );
}
