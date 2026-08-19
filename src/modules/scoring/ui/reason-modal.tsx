'use client';

import { useState } from 'react';
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
import { Textarea } from '@/shared/ui/shadcn/textarea';
import { Label } from '@/shared/ui/shadcn/label';
import { GhostButton, GoldButton } from '@/shared/ui/organizer/buttons';
import { IconX } from '@/shared/ui/organizer/icons';
import {
  ModalEyebrow,
  modalBodyClass,
  modalContentClass,
  modalFooterClass,
} from '@/shared/ui/organizer/modal-kit';
import { cn } from '@/shared/lib/utils';

export function ReasonModal({
  open,
  onOpenChange,
  title,
  description,
  required,
  isPending,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  required: boolean;
  isPending: boolean;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState('');
  const canConfirm = !required || reason.trim().length > 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (next) setReason('');
      }}
    >
      <DialogContent className={modalContentClass} showCloseButton={false}>
        <DialogHeader className={modalBodyClass + ' gap-1.5 pb-0'}>
          <ModalEyebrow>Ride action</ModalEyebrow>
          <DialogTitle className="font-serif text-2xl font-semibold text-[#0D2C23]">
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
          <DialogClose className="absolute top-4 right-4 flex size-7 items-center justify-center rounded-full bg-[#E6F1EA] text-[#1A5B3C] transition-colors hover:bg-[#D5E8DC]">
            <IconX size={13} />
            <span className="sr-only">Close</span>
          </DialogClose>
        </DialogHeader>

        <div className={modalBodyClass}>
          <div className="space-y-1.5">
            <Label htmlFor="reason-text">Reason{required ? '' : ' (optional)'}</Label>
            <Textarea
              id="reason-text"
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
              }}
            />
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
          <GoldButton
            type="button"
            disabled={isPending || !canConfirm}
            className={cn((isPending || !canConfirm) && 'opacity-70')}
            onClick={() => {
              onConfirm(reason.trim());
            }}
          >
            {isPending && <Loader2Icon className="size-4 animate-spin" aria-hidden />}
            {isPending ? 'Working…' : 'Confirm'}
          </GoldButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
