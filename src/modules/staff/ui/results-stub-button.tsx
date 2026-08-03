'use client';

import { toast } from 'sonner';
import { cn } from '@/shared/lib/utils';
import { ghostButtonClass } from '@/shared/ui/organizer/buttons';
import { DashIcon } from '@/shared/ui/dash-icon';

/**
 * "Results" — no results viewer exists yet, so this is a toast stub rather than
 * a dead link, matching the honesty pattern used wherever a design-mandated
 * button has nothing behind it yet.
 *
 * The Dashboard's own Awards button used to be this too; it now opens the real
 * Awards screen. This one survives on Users, where the trailing slot for a live
 * show still has nowhere to go.
 */
export function ResultsStubButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        toast('Results isn’t built yet — coming in a later update.');
      }}
      className={cn(ghostButtonClass, className)}
    >
      <DashIcon name="trophy" size={14} /> Results
    </button>
  );
}
