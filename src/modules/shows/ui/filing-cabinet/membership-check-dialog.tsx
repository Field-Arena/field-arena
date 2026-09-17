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
import { Label } from '@/shared/ui/shadcn/label';
import { Textarea } from '@/shared/ui/shadcn/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/shadcn/select';
import { GhostButton, GoldButton } from '@/shared/ui/organizer/buttons';
import { IconX } from '@/shared/ui/organizer/icons';
import {
  ModalEyebrow,
  modalBodyClass,
  modalContentClass,
  modalFooterClass,
} from '@/shared/ui/organizer/modal-kit';
import { MEMBERSHIP_FLAGS, MEMBERSHIP_FLAG_LABELS } from '@/modules/shows/constants';
import type { MembershipLedgerRow, MembershipFlag } from '@/modules/shows/data/membership-ledger-queries';
import { useUpdateMembershipCheck } from '@/modules/shows/hooks/use-membership-ledger-mutations';

export function MembershipCheckDialog({ showId, row }: { showId: string; row: MembershipLedgerRow }) {
  const [open, setOpen] = useState(false);
  const [association, setAssociation] = useState(row.association ?? '');
  const [riderNum, setRiderNum] = useState(row.riderMembershipNumber ?? '');
  const [horseNum, setHorseNum] = useState(row.horseRegistrationNumber ?? '');
  const [ownerNum, setOwnerNum] = useState(row.ownerMembershipNumber ?? '');
  const [membershipStatus, setMembershipStatus] = useState(row.membershipStatus);
  const [horseRegStatus, setHorseRegStatus] = useState(row.horseRegistrationStatus);
  const [flags, setFlags] = useState<MembershipFlag[]>(row.flags);
  const [notes, setNotes] = useState(row.notes ?? '');

  const { mutate, isPending } = useUpdateMembershipCheck({
    onSuccess: () => {
      setOpen(false);
    },
  });

  function toggleFlag(flag: MembershipFlag) {
    setFlags((prev) => (prev.includes(flag) ? prev.filter((f) => f !== flag) : [...prev, flag]));
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        <GhostButton type="button" className="h-8 px-2.5 py-0 text-[12px]">
          Edit
        </GhostButton>
      </DialogTrigger>

      <DialogContent className={modalContentClass} showCloseButton={false}>
        <DialogHeader className={modalBodyClass + ' gap-1.5 pb-0'}>
          <ModalEyebrow>Membership Ledger</ModalEyebrow>
          <DialogTitle className="font-serif text-2xl font-semibold text-[#0D2C23]">
            {row.riderName} — {row.horseName}
          </DialogTitle>
          <DialogDescription>
            Entry {row.entryNumber} · Bridle {row.bridleNumber}
          </DialogDescription>
          <DialogClose className="absolute top-4 right-4 flex size-7 items-center justify-center rounded-full bg-[#E6F1EA] text-[#1A5B3C] transition-colors hover:bg-[#D5E8DC]">
            <IconX size={13} />
            <span className="sr-only">Close</span>
          </DialogClose>
        </DialogHeader>

        <div className={modalBodyClass}>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Association</Label>
              <Input value={association} onChange={(e) => { setAssociation(e.target.value); }} />
            </div>
            <div className="space-y-1.5">
              <Label>Rider membership #</Label>
              <Input value={riderNum} onChange={(e) => { setRiderNum(e.target.value); }} />
            </div>
            <div className="space-y-1.5">
              <Label>Horse registration #</Label>
              <Input value={horseNum} onChange={(e) => { setHorseNum(e.target.value); }} />
            </div>
            <div className="space-y-1.5">
              <Label>Owner membership #</Label>
              <Input value={ownerNum} onChange={(e) => { setOwnerNum(e.target.value); }} />
            </div>
            <div className="space-y-1.5">
              <Label>Membership status</Label>
              <Select
                value={membershipStatus}
                onValueChange={(v) => { setMembershipStatus(v as typeof membershipStatus); }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unknown">Unknown</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Horse registration status</Label>
              <Select
                value={horseRegStatus}
                onValueChange={(v) => { setHorseRegStatus(v as typeof horseRegStatus); }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unknown">Unknown</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Flags</Label>
            <div className="flex flex-col gap-1.5">
              {MEMBERSHIP_FLAGS.map((flag) => (
                <label key={flag} className="flex cursor-pointer items-center gap-2 text-[13px]">
                  <input
                    type="checkbox"
                    className="accent-hunter-deep size-4"
                    checked={flags.includes(flag)}
                    onChange={() => {
                      toggleFlag(flag);
                    }}
                  />
                  {MEMBERSHIP_FLAG_LABELS[flag]}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => { setNotes(e.target.value); }} rows={3} />
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
              mutate({
                showId,
                showEntryId: row.showEntryId,
                association: association || undefined,
                riderMembershipNumber: riderNum || undefined,
                horseRegistrationNumber: horseNum || undefined,
                ownerMembershipNumber: ownerNum || undefined,
                membershipStatus,
                horseRegistrationStatus: horseRegStatus,
                flags,
                notes: notes || undefined,
              });
            }}
          >
            {isPending && <Loader2Icon className="size-4 animate-spin" aria-hidden />}
            {isPending ? 'Saving…' : 'Save'}
          </GoldButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
