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
  DialogTrigger,
} from '@/shared/ui/shadcn/dialog';
import { Label } from '@/shared/ui/shadcn/label';
import { FA_BTN, FA_BTN_PRIMARY, FA_BTN_SMALL, FA_INPUT } from '@/shared/ui/organizer/fa-page';
import { useSignVendorAgreement } from '@/modules/vendors/hooks/use-vendor-mutations';

const DEFAULT_AGREEMENT_TEXT =
  'This organizer has not written a custom booth agreement yet. By signing below, you agree to ' +
  'follow all posted show rules, load-in/load-out times, and any instructions from show staff ' +
  'for your booth space.';

export function VendorAgreementDialog({
  bookingId,
  showName,
  agreementText,
}: {
  bookingId: string;
  showName: string;
  agreementText: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const { mutate, isPending } = useSignVendorAgreement();

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setFullName('');
      }}
    >
      <DialogTrigger asChild>
        <button type="button" className={FA_BTN_SMALL}>
          Sign booth agreement
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="font-[family-name:var(--ws-fraunces)] text-[22px] font-bold text-[#0D2C23]">
            Vendor booth agreement
          </DialogTitle>
          <DialogDescription>{showName}</DialogDescription>
        </DialogHeader>

        <div className="max-h-[220px] overflow-y-auto rounded-lg border border-[#E9EDEB] p-3 text-[13px] whitespace-pre-wrap text-[#7A8781]">
          {agreementText ?? DEFAULT_AGREEMENT_TEXT}
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            mutate(
              { bookingId, fullName },
              {
                onSuccess: () => {
                  setOpen(false);
                  setFullName('');
                },
              },
            );
          }}
          className="space-y-4"
          noValidate
        >
          <div className="space-y-1.5">
            <Label htmlFor="va-agree-name">Type your full legal name to sign</Label>
            <input
              className={`${FA_INPUT} w-full`}
              id="va-agree-name"
              required
              placeholder="Jane Smith"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
              }}
            />
          </div>

          <DialogFooter>
            <button
              type="button"
              className={FA_BTN}
              onClick={() => {
                setOpen(false);
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={FA_BTN_PRIMARY}
              disabled={isPending || !fullName.trim()}
            >
              {isPending && <Loader2Icon className="size-4 animate-spin" aria-hidden />}
              {isPending ? 'Signing…' : 'Sign & continue'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
