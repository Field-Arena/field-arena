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
  DialogTrigger,
} from '@/shared/ui/shadcn/dialog';
import { Textarea } from '@/shared/ui/shadcn/textarea';
import { Label } from '@/shared/ui/shadcn/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/shadcn/select';
import { GhostButton, GoldButton, DangerButton } from '@/shared/ui/organizer/buttons';
import { IconX } from '@/shared/ui/organizer/icons';
import {
  ModalEyebrow,
  modalBodyClass,
  modalContentClass,
  modalFooterClass,
} from '@/shared/ui/organizer/modal-kit';
import { REJECTION_REASONS, REJECTION_REASON_LABELS } from '@/modules/shows/constants';
import type { HorseDocumentStatus } from '@/modules/shows/data/horses-queries';
import { useReviewHorseDocument } from '@/modules/shows/hooks/use-horses-mutations';

export function DocumentReviewDialog({
  showId,
  horseId,
  horseName,
  doc,
}: {
  showId: string;
  horseId: string;
  horseName: string;
  doc: HorseDocumentStatus;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<(typeof REJECTION_REASONS)[number]>('unreadable');
  const [note, setNote] = useState('');

  const { mutate, isPending } = useReviewHorseDocument({
    onSuccess: () => {
      setOpen(false);
      setNote('');
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <GhostButton type="button" className="h-8 px-2.5 py-0 text-[12px]">
          Review
        </GhostButton>
      </DialogTrigger>

      <DialogContent className={modalContentClass} showCloseButton={false}>
        <DialogHeader className={modalBodyClass + ' gap-1.5 pb-0'}>
          <ModalEyebrow>Unprocessed Documents</ModalEyebrow>
          <DialogTitle className="font-serif text-2xl font-semibold text-[#0D2C23]">
            {doc.label} — {horseName}
          </DialogTitle>
          <DialogDescription>
            {doc.url ? 'Open the file, then approve, reject, or ask for a replacement.' : 'No file on record.'}
          </DialogDescription>
          <DialogClose className="absolute top-4 right-4 flex size-7 items-center justify-center rounded-full bg-[#E6F1EA] text-[#1A5B3C] transition-colors hover:bg-[#D5E8DC]">
            <IconX size={13} />
            <span className="sr-only">Close</span>
          </DialogClose>
        </DialogHeader>

        <div className={modalBodyClass}>
          {doc.url && (
            <a
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:border-gold inline-flex w-fit items-center rounded-md border border-[#D9E1DD] px-3 py-1.5 text-[13px] font-semibold text-[#0D2C23] transition-colors"
            >
              View document
            </a>
          )}

          <div className="space-y-1.5">
            <Label>Reason (if rejecting)</Label>
            <Select value={reason} onValueChange={(v) => { setReason(v as typeof reason); }}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REJECTION_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {REJECTION_REASON_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Note to the entrant (optional, required for &ldquo;Other&rdquo;)</Label>
            <Textarea value={note} onChange={(e) => { setNote(e.target.value); }} rows={3} />
          </div>
        </div>

        <DialogFooter className={modalFooterClass + ' flex-wrap'}>
          <GhostButton
            type="button"
            disabled={isPending}
            onClick={() => {
              mutate({ showId, horseId, requirementId: doc.requirementId, status: 'replacement_requested' });
            }}
          >
            Request replacement
          </GhostButton>
          <DangerButton
            type="button"
            disabled={isPending}
            onClick={() => {
              mutate({
                showId,
                horseId,
                requirementId: doc.requirementId,
                status: 'rejected',
                rejectionReason: reason,
                rejectionNote: note || undefined,
              });
            }}
          >
            Reject
          </DangerButton>
          <GoldButton
            type="button"
            disabled={isPending}
            onClick={() => {
              mutate({ showId, horseId, requirementId: doc.requirementId, status: 'approved' });
            }}
          >
            {isPending && <Loader2Icon className="size-4 animate-spin" aria-hidden />}
            Approve
          </GoldButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
