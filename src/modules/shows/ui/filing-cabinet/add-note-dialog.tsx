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
import { Input } from '@/shared/ui/shadcn/input';
import { Textarea } from '@/shared/ui/shadcn/textarea';
import { Label } from '@/shared/ui/shadcn/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/shadcn/select';
import { GhostButton, GoldButton, primaryButtonClass } from '@/shared/ui/organizer/buttons';
import { IconX } from '@/shared/ui/organizer/icons';
import {
  ModalEyebrow,
  modalBodyClass,
  modalContentClass,
  modalFooterClass,
} from '@/shared/ui/organizer/modal-kit';
import { useAddManualIssue } from '@/modules/shows/hooks/use-entry-issues-mutations';

export function AddNoteDialog({
  showId,
  entries,
}: {
  showId: string;
  entries: { id: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [showEntryId, setShowEntryId] = useState(entries[0]?.id ?? '');
  const [kind, setKind] = useState<'note' | 'request'>('note');
  const [message, setMessage] = useState('');
  const [detail, setDetail] = useState('');

  const { mutate, isPending } = useAddManualIssue({
    onSuccess: () => {
      setOpen(false);
      setMessage('');
      setDetail('');
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" className={primaryButtonClass}>
          <span aria-hidden>+</span> Add note / request
        </button>
      </DialogTrigger>

      <DialogContent className={modalContentClass} showCloseButton={false}>
        <DialogHeader className={modalBodyClass + ' gap-1.5 pb-0'}>
          <ModalEyebrow>Issues / Notes / Requests</ModalEyebrow>
          <DialogTitle className="font-serif text-2xl font-semibold text-[#0D2C23]">
            Add a note or request
          </DialogTitle>
          <DialogDescription>For anything staff need to track that isn&apos;t already flagged automatically.</DialogDescription>
          <DialogClose className="absolute top-4 right-4 flex size-7 items-center justify-center rounded-full bg-[#E6F1EA] text-[#1A5B3C] transition-colors hover:bg-[#D5E8DC]">
            <IconX size={13} />
            <span className="sr-only">Close</span>
          </DialogClose>
        </DialogHeader>

        <div className={modalBodyClass}>
          <div className="space-y-1.5">
            <Label>Entry</Label>
            <Select value={showEntryId} onValueChange={setShowEntryId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose an entry" />
              </SelectTrigger>
              <SelectContent>
                {entries.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={kind} onValueChange={(v) => { setKind(v as typeof kind); }}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="note">Note</SelectItem>
                <SelectItem value="request">Request</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Summary</Label>
            <Input value={message} onChange={(e) => { setMessage(e.target.value); }} maxLength={300} />
          </div>

          <div className="space-y-1.5">
            <Label>Detail (optional)</Label>
            <Textarea value={detail} onChange={(e) => { setDetail(e.target.value); }} rows={3} />
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
            disabled={isPending || !showEntryId || !message.trim()}
            onClick={() => {
              mutate({ showId, showEntryId, kind, message: message.trim(), detail: detail || undefined });
            }}
          >
            {isPending && <Loader2Icon className="size-4 animate-spin" aria-hidden />}
            {isPending ? 'Adding…' : 'Add'}
          </GoldButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
