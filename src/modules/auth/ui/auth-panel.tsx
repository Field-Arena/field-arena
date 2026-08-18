import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';

/** Each auth view fades in on its own, so switching panels reads as a step, not a jump. */
export function AuthPanel({ children, centred }: { children: ReactNode; centred?: boolean }) {
  return (
    <div
      className={cn(
        'flex flex-col [animation:fa-in_.22s_ease-out_both]',
        centred && 'items-center text-center',
      )}
    >
      {children}
    </div>
  );
}
