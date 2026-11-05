'use client';

import { useState } from 'react';
import { cn } from '@/shared/lib/utils';
import { ghostButtonClass, primaryButtonClass } from '@/shared/ui/organizer/buttons';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { useCreateDraftShow } from '@/modules/shows/hooks/use-show-mutations';

export function NewShowButton({
  className,
  variant = 'ghost',
}: {
  className?: string;
  variant?: 'ghost' | 'primary';
}) {
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
          variant === 'primary' ? primaryButtonClass : ghostButtonClass,
          'disabled:opacity-70',
          className,
        )}
      >
        <svg
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
        </svg>
        New Show
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
