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
import { useAssignBridleNumber } from '@/modules/shows/hooks/use-bridle-number-mutations';

const AUTO = '__auto__';

export function BridleNumberAssignDialog({
  showId,
  showHorseId,
  horseName,
  currentNumber,
  availableNumbers,
}: {
  showId: string;
  showHorseId: string;
  horseName: string;
  currentNumber: string | null;
  availableNumbers: number[];
}) {
  const [open, setOpen] = useState(false);
  const [pick, setPick] = useState<string>(AUTO);
  const [reason, setReason] = useState('');

  const { mutate, isPending } = useAssignBridleNumber({
    onSuccess: () => {
      setOpen(false);
      setPick(AUTO);
      setReason('');
    },
  });

  const isReplace = currentNumber !== null;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        <GhostButton type="button" className="h-8 px-2.5 py-0 text-[13px]">
          {currentNumber ?? 'Assign'}
        </GhostButton>
      </DialogTrigger>

      <DialogContent className={modalContentClass} showCloseButton={false}>
        <DialogHeader className={modalBodyClass + ' gap-1.5 pb-0'}>
          <ModalEyebrow>Bridle Number</ModalEyebrow>
          <DialogTitle className="font-serif text-2xl font-semibold text-[#0D2C23]">
            {horseName}
          </DialogTitle>
          <DialogDescription>
            {isReplace
              ? `Currently ${currentNumber} — replacing it retires that number and records why.`
              : "This horse hasn't been assigned a bridle number yet."}
          </DialogDescription>
          <DialogClose className="absolute top-4 right-4 flex size-7 items-center justify-center rounded-full bg-[#E6F1EA] text-[#1A5B3C] transition-colors hover:bg-[#D5E8DC]">
            <IconX size={13} />
            <span className="sr-only">Close</span>
          </DialogClose>
        </DialogHeader>

        <div className={modalBodyClass}>
          <div className="space-y-1.5">
            <Label>Number</Label>
            <Select
              value={pick}
              onValueChange={(v) => {
                setPick(v);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={AUTO}>Auto-assign next available</SelectItem>
                {availableNumbers.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {availableNumbers.length === 0 && (
              <p className="text-[12px] text-[#B4432F]">
                No numbers are available — add a range in Bridle Numbers first.
              </p>
            )}
          </div>

          {isReplace && (
            <div className="space-y-1.5">
              <Label>Reason for the change</Label>
              <Input
                value={reason}
                placeholder="e.g. lost tag, damaged"
                onChange={(e) => {
                  setReason(e.target.value);
                }}
              />
            </div>
          )}
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
            disabled={isPending || (pick === AUTO && availableNumbers.length === 0)}
            onClick={() => {
              mutate({
                showId,
                showHorseId,
                explicitNumber: pick === AUTO ? undefined : Number(pick),
                reason: reason.trim() || undefined,
              });
            }}
          >
            {isPending && <Loader2Icon className="size-4 animate-spin" aria-hidden />}
            {isPending ? 'Saving…' : isReplace ? 'Replace number' : 'Assign number'}
          </GoldButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
