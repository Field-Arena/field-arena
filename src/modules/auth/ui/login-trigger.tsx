'use client';

import type { ReactNode } from 'react';
import { useLoginDialogStore } from '../store';

/** Opens the sign-in dialog. Keeps the surrounding section a server component. */
export function LoginTrigger({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const openDialog = useLoginDialogStore((state) => state.openDialog);

  return (
    <button type="button" onClick={openDialog} className={className}>
      {children}
    </button>
  );
}
