'use client';

import { useState } from 'react';
import { Trash2Icon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/shadcn/dialog';
import { Button } from '@/shared/ui/shadcn/button';

/* Removing a criteria row asks first — legacy catDelRow's reasoning holds:
 * "the catalog has no separate confirmation for reconstructing it by hand."
 * A transcribed movement or collective is real work to retype. */
export function RowRemove({
  label,
  onClick,
  confirmTitle,
}: {
  label: string;
  onClick: () => void;
  confirmTitle?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        aria-label={label}
        onClick={() => {
          setOpen(true);
        }}
        className="grid size-[30px] h-auto flex-none place-items-center rounded-[7px] border border-transparent p-0 text-[#B4432F] transition-colors hover:border-[#F0D3CE] hover:bg-[#FCF1EF]"
      >
        <Trash2Icon className="size-[14px]" aria-hidden />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="text-hunter-deep font-serif text-lg">
              {confirmTitle ?? 'Remove this row?'}
            </DialogTitle>
            <DialogDescription>
              Rebuilding it means retyping the criteria by hand. The sheet isn&apos;t saved until
              you press Save, so you can still leave without applying this.
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
              onClick={() => {
                onClick();
                setOpen(false);
              }}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
