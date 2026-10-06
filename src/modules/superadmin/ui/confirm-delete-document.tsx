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

/* Deleting a document removes the stored file as well as the row — there is no
 * undo and no soft-delete for platform files, so it asks first. Legacy gated
 * every deleteDoc() call behind exactly this confirmation. */
export function ConfirmDeleteDocument({
  fileName,
  pending,
  onConfirm,
  className,
}: {
  fileName: string;
  pending?: boolean;
  onConfirm: () => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        disabled={pending}
        onClick={() => {
          setOpen(true);
        }}
        className={className}
      >
        Delete
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg text-[#101828]">
              Delete this document?
            </DialogTitle>
            <DialogDescription className="leading-relaxed">
              <span className="font-semibold text-[#101828]">{fileName}</span> and its stored file
              are removed permanently. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
              }}
            >
              Keep
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={pending}
              onClick={() => {
                onConfirm();
                setOpen(false);
              }}
            >
              {pending && <Loader2Icon className="animate-spin" aria-hidden />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
