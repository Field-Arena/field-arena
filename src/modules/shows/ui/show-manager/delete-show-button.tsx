'use client';

import { useState } from 'react';
import { DangerButton } from '@/shared/ui/organizer/buttons';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { useDeleteShow } from '../../hooks/use-show-mutations';

/**
 * "Delete" on a show row — Show Manager's picker and the Incomplete Shows
 * list both had this same button with a raw `window.confirm()`. Replaced
 * with the app's own dialog styling rather than the browser's native prompt.
 */
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
          mutate(showId, { onSuccess: () => { setOpen(false); } });
        }}
      />
    </>
  );
}
