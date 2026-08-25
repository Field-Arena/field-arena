'use client';

import { useState } from 'react';
import { DangerButton } from '@/shared/ui/organizer/buttons';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { useDeleteShow } from '@/modules/shows/hooks/use-show-mutations';

export function DeleteShowButton({ showId, showName }: { showId: string; showName: string }) {
  const [open, setOpen] = useState(false);
  const { mutate, isPending } = useDeleteShow();

  return (
    <>
      <DangerButton
        disabled={isPending}
        onClick={() => {
          setOpen(true);
        }}
      >
        {isPending ? 'Deleting…' : 'Delete'}
      </DangerButton>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`Delete "${showName}"?`}
        description="This can't be undone."
        confirmLabel={isPending ? 'Deleting…' : 'Delete'}
        destructive
        pending={isPending}
        onConfirm={() => {
          mutate(showId, {
            onSuccess: () => {
              setOpen(false);
            },
          });
        }}
      />
    </>
  );
}
