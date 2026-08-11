'use client';

import { useState } from 'react';
import { cn } from '@/shared/lib/utils';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { useCreateDraftShow } from '../../hooks/use-show-mutations';

/**
 * "+ New Show" — the single entry point into the Show Manager flow.
 *
 * A confirmation gate sits in front of the create (BUG-NEWSHOW-001): the show is
 * still made in one step and the organizer lands on Setup — where Show Details
 * is the first card — but an accidental click no longer silently persists a
 * blank draft. On confirm the draft is created and can be filled in there, or
 * deleted from the show picker if they change their mind.
 */
export function NewShowButton({ className }: { className?: string }) {
  const { mutate, isPending } = useCreateDraftShow();
  const [confirming, setConfirming] = useState(false);

  return (
    <>
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          setConfirming(true);
        }}
        className={cn(
          'inline-flex items-center gap-[9px] rounded-[10px] bg-[#0D2C23] px-[18px] py-3',
          'text-[13.5px] font-bold text-white transition-colors hover:bg-[#16261F]',
          'disabled:opacity-70',
          className
        )}
      >
        + New Show
      </button>

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title="Start a new show?"
        description="This creates a new draft show and opens its Setup, where you can fill in the details. You can delete it from the show picker if you change your mind."
        confirmLabel={isPending ? 'Creating…' : 'Create show'}
        cancelLabel="Cancel"
        pending={isPending}
        onConfirm={() => {
          mutate();
        }}
      />
    </>
  );
}
