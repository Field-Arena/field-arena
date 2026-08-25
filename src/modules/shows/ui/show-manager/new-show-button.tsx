'use client';

import { useState } from 'react';
import { Button } from '@/shared/ui/shadcn/button';
import { cn } from '@/shared/lib/utils';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { useCreateDraftShow } from '@/modules/shows/hooks/use-show-mutations';

export function NewShowButton({ className }: { className?: string }) {
  const { mutate, isPending } = useCreateDraftShow();
  const [confirming, setConfirming] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        disabled={isPending}
        onClick={() => {
          setConfirming(true);
        }}
        className={cn(
          'inline-flex h-auto items-center gap-[9px] rounded-[10px] bg-[#0D2C23] px-[18px] py-3',
          'text-[13.5px] font-bold text-white transition-colors hover:bg-[#16261F]',
          'disabled:opacity-70',
          className,
        )}
      >
        + New Show
      </Button>

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
