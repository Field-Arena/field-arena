'use client';

import { useState } from 'react';
import { CheckIcon } from 'lucide-react';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { Button } from '@/shared/ui/shadcn/button';
import { useApproveSchedule } from '@/modules/shows/hooks/use-run-show-mutations';

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
      <span className="fa-btn fa-btn-ghost pointer-events-none !text-[var(--fa-emerald)]">
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
        className="fa-btn fa-btn-primary h-auto"
        onClick={() => {
          setConfirming(true);
        }}
      >
        <CheckIcon className="size-4" aria-hidden />
        {approve.isPending ? 'Publishing…' : 'Publish schedule'}
      </Button>

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title="Publish this schedule?"

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
