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
import { GhostButton, GoldButton } from '@/shared/ui/organizer/buttons';
import { IconX } from '@/shared/ui/organizer/icons';
import {
  ModalEyebrow,
  modalBodyClass,
  modalContentClass,
  modalFooterClass,
} from '@/shared/ui/organizer/modal-kit';
import type { EntryIssueRow } from '@/modules/shows/data/entry-issues-queries';
import { useResolveIssue } from '@/modules/shows/hooks/use-entry-issues-mutations';

export function ResolveIssueDialog({ showId, issue }: { showId: string; issue: EntryIssueRow }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');

  const { mutate, isPending } = useResolveIssue({
    onSuccess: () => {
      setOpen(false);
      setNote('');
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <GhostButton type="button" className="h-8 px-2.5 py-0 text-[12px]">
          Resolve
        </GhostButton>
      </DialogTrigger>

      <DialogContent className={modalContentClass} showCloseButton={false}>
        <DialogHeader className={modalBodyClass + ' gap-1.5 pb-0'}>
          <ModalEyebrow>Issues / Notes / Requests</ModalEyebrow>
          <DialogTitle className="font-serif text-2xl font-semibold text-[#0D2C23]">Resolve issue</DialogTitle>
          <DialogDescription>
            {issue.message} — {issue.riderName} / {issue.horseName}. This leaves the active list but the
            record stays for the review log.
          </DialogDescription>
          <DialogClose className="absolute top-4 right-4 flex size-7 items-center justify-center rounded-full bg-[#E6F1EA] text-[#1A5B3C] transition-colors hover:bg-[#D5E8DC]">
            <IconX size={13} />
            <span className="sr-only">Close</span>
          </DialogClose>
        </DialogHeader>

        <div className={modalBodyClass}>
          <div className="space-y-1.5">
            <Label>Resolution note (optional)</Label>
            <Textarea value={note} onChange={(e) => { setNote(e.target.value); }} rows={3} />
          </div>
        </div>

        <DialogFooter className={modalFooterClass}>
          <GhostButton
            type="button"
            onClick={() => {
              setOpen(false);
            }}
          >
            Cancel
          </GhostButton>
          <GoldButton
            type="button"
            disabled={isPending}
            onClick={() => {
              mutate({ showId, issueId: issue.id, resolutionNote: note || undefined });
            }}
          >
            {isPending && <Loader2Icon className="size-4 animate-spin" aria-hidden />}
            {isPending ? 'Resolving…' : 'Resolve'}
          </GoldButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
