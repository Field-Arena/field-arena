import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';

export function AuthPanel({ children, centred }: { children: ReactNode; centred?: boolean }) {
  return (
    <div
      className={cn(
        'flex [animation:fa-in_.22s_ease-out_both] flex-col',
        centred && 'items-center text-center',
      )}
    >
      {children}
    </div>
  );
}
