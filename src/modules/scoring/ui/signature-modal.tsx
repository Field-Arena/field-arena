'use client';

import { Loader2Icon } from 'lucide-react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/shadcn/dialog';
import { GhostButton, GoldButton } from '@/shared/ui/organizer/buttons';
import { IconX } from '@/shared/ui/organizer/icons';
import { ModalEyebrow, modalBodyClass, modalContentClass, modalFooterClass } from '@/shared/ui/organizer/modal-kit';
import { cn } from '@/shared/lib/utils';

/** "Sign & Submit", ported from showrunner-scoring.html's openSignatureModal. */
export function SignatureModal({
  open,
  onOpenChange,
  judgeName,
  isPending,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  judgeName: string;
  isPending: boolean;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={modalContentClass} showCloseButton={false}>
        <DialogHeader className={modalBodyClass + ' gap-1.5 pb-0'}>
          <ModalEyebrow>Scoresheet</ModalEyebrow>
          <DialogTitle className="font-serif text-2xl font-semibold text-[#0D2C23]">
            Sign &amp; Submit
          </DialogTitle>
          <DialogDescription>
            This scoresheet becomes final once signed. An Admin can reopen it later if needed.
          </DialogDescription>
          <DialogClose className="absolute top-4 right-4 flex size-7 items-center justify-center rounded-full bg-[#E6F1EA] text-[#1A5B3C] transition-colors hover:bg-[#D5E8DC]">
            <IconX size={13} />
            <span className="sr-only">Close</span>
          </DialogClose>
        </DialogHeader>

        <div className={modalBodyClass}>
          <div className="rounded-xl border border-[#E9EDEB] bg-[#FBFAF5] p-6 text-center">
            <p className="mb-1 text-[12px] text-[#7A8781]">Signed by</p>
            <p className="font-[Newsreader,serif] text-3xl text-ink-deep italic">{judgeName}</p>
          </div>
        </div>

        <DialogFooter className={modalFooterClass}>
          <GhostButton
            type="button"
            onClick={() => {
              onOpenChange(false);
            }}
          >
            Cancel
          </GhostButton>
          <GoldButton type="button" disabled={isPending} className={cn(isPending && 'opacity-70')} onClick={onConfirm}>
            {isPending && <Loader2Icon className="size-4 animate-spin" aria-hidden />}
            {isPending ? 'Submitting…' : 'Sign & Submit'}
          </GoldButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
