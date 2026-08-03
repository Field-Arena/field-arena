'use client';

import { toast } from 'sonner';
import { cn } from '@/shared/lib/utils';
import { ghostButtonClass } from '@/shared/ui/organizer/buttons';
import { DashIcon } from '@/shared/ui/dash-icon';

/**
 * "Results" on the Dashboard — no results/awards viewer exists yet (no
 * "/shows/[showId]/results" route was ever built), so this was a dead link.
 * Toast stub instead, matching the honesty pattern used everywhere else an
 * unbuilt feature has a design-mandated button (Venue's "Assign Judges",
 * Run Show's "Announcer view").
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
