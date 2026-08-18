'use client';

import { useState } from 'react';
import { CheckIcon, SendIcon } from 'lucide-react';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { Button } from '@/shared/ui/shadcn/button';
import { cn } from '@/shared/lib/utils';
import { SM_GHOST_BTN } from '@/modules/shows/ui/show-manager/tokens';
import { useApproveSchedule } from '@/modules/shows/hooks/use-run-show-mutations';

/**
 * Approves the built schedule and pushes it live.
 *
 * Writes the same `runner_state.approved` flag the Run Show tab sets — one
 * value, two places to set it, because the decision "this schedule is right"
 * is made while looking at the schedule, not on a separate stage tracker.
 *
 * One-way, matching the runner's own stage progression: there is no unpublish.
 * That is why it asks first, and why the dialog says exactly who is about to
 * see it rather than a vague "are you sure".
 */
export function PublishScheduleButton({
  showId,
  published,
}: {
  showId: string;
  published: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  const approve = useApproveSchedule();

  if (published) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-[9px] bg-[#E3F0E5] px-3 py-2 text-[12.5px] font-semibold text-[#2E7048]">
        <CheckIcon className="size-4" aria-hidden />
        Schedule published
      </span>
    );
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        disabled={approve.isPending}
        className={cn('h-auto', SM_GHOST_BTN, 'border-gold text-forest', 'hover:bg-transparent')}
        onClick={() => {
          setConfirming(true);
        }}
      >
        <SendIcon className="size-4" aria-hidden />
        {approve.isPending ? 'Publishing…' : 'Publish schedule'}
      </Button>

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title="Publish this schedule?"
        /* Names only the audiences that actually exist. The rider portal is not
           built, so promising riders will see it would be a lie the organizer
           only discovers when someone asks them for their ride time. */
        description="Judges and the announcer will see these ride times. You can still reorder rides and move classes afterwards — publishing does not freeze the schedule."
        confirmLabel={approve.isPending ? 'Publishing…' : 'Publish'}
        pending={approve.isPending}
        onConfirm={() => {
          approve.mutate(showId);
        }}
      />
    </>
  );
}
