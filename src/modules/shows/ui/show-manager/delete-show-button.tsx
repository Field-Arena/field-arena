'use client';

import { useState } from 'react';
import { Loader2Icon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/shadcn/dialog';
import { Button } from '@/shared/ui/shadcn/button';
import { Input } from '@/shared/ui/shadcn/input';
import { Label } from '@/shared/ui/shadcn/label';
import { DangerButton } from '@/shared/ui/organizer/buttons';
import { useDeleteShow } from '@/modules/shows/hooks/use-show-mutations';

/* A show still in setup deletes behind a plain confirmation. One that is
 * already on sale or live may have real rider and vendor entries against it,
 * so it additionally requires typing the show name back — the same escalation
 * legacy's deleteShowSA() applied, and the reason it spelled out the organizer
 * name alongside it (show names repeat across clients: "Spring Classic",
 * "Fall Show"). */
export function DeleteShowButton({
  showId,
  showName,
  orgName,
  requireNameConfirmation = false,
}: {
  showId: string;
  showName: string;
  orgName?: string | null;
  requireNameConfirmation?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const { mutate, isPending } = useDeleteShow();

  const nameMatches = typed.trim() === showName;
  const canDelete = !requireNameConfirmation || nameMatches;

  function close() {
    setOpen(false);
    setTyped('');
  }

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

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) close();
          else setOpen(true);
        }}
      >
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="text-hunter-deep font-serif text-xl">
              Delete &ldquo;{showName}&rdquo;{orgName ? ` (${orgName})` : ''}?
            </DialogTitle>
            <DialogDescription className="leading-relaxed">
              {requireNameConfirmation
                ? 'This show is already on sale or live — real riders and vendors may have real entries against it. '
                : ''}
              This removes its divisions, classes, staff, vendors and documents. This can&apos;t be
              undone.
            </DialogDescription>
          </DialogHeader>

          {requireNameConfirmation && (
            <div className="space-y-2">
              <Label htmlFor={`confirm-delete-${showId}`} className="text-[13px] font-semibold">
                Type the show name to confirm
              </Label>
              <Input
                id={`confirm-delete-${showId}`}
                value={typed}
                autoComplete="off"
                placeholder={showName}
                onChange={(event) => {
                  setTyped(event.target.value);
                }}
              />
              {typed.trim().length > 0 && !nameMatches && (
                <p role="alert" className="text-[12.5px] text-[#B4432F]">
                  The show name doesn&apos;t match yet — nothing will be deleted.
                </p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={close}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isPending || !canDelete}
              onClick={() => {
                mutate(showId, { onSuccess: close });
              }}
            >
              {isPending && <Loader2Icon className="animate-spin" aria-hidden />}
              {isPending ? 'Deleting…' : 'Delete show'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
