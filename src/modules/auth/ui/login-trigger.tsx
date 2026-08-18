'use client';

import type { ReactNode } from 'react';
import { Button } from '@/shared/ui/shadcn/button';
import { cn } from '@/shared/lib/utils';
import { useLoginDialogStore } from '@/modules/auth/store';

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
    <Button
      type="button"
      variant="ghost"
      onClick={openDialog}
      className={cn('h-auto bg-transparent p-0 hover:bg-transparent', className)}
    >
      {children}
    </Button>
  );
}
