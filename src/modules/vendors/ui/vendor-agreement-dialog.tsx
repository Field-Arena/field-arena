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
import { Button } from '@/shared/ui/shadcn/button';
import { Input } from '@/shared/ui/shadcn/input';
import { Label } from '@/shared/ui/shadcn/label';
import { useSignVendorAgreement } from '../hooks/use-vendor-mutations';

const DEFAULT_AGREEMENT_TEXT =
  'This organizer has not written a custom booth agreement yet. By signing below, you agree to ' +
  'follow all posted show rules, load-in/load-out times, and any instructions from show staff ' +
  'for your booth space.';

/**
 * "Sign & continue" — ported from vendor.html's renderAgreementStep /
 * signAgreementAndContinue. Legacy gated payment behind this signature; this
 * port has no payment step to gate (see listBookableShows's doc comment), so
 * signing here simply records the vendor's agreement to the show's terms
 * ahead of the organizer countersigning off-line.
 */
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
        <Button type="button" size="sm" variant="outline">
          Sign booth agreement
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-hunter-deep">
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
              { onSuccess: () => { setOpen(false); setFullName(''); } }
            );
          }}
          className="space-y-4"
          noValidate
        >
          <div className="space-y-1.5">
            <Label htmlFor="va-agree-name">Type your full legal name to sign</Label>
            <Input
              id="va-agree-name"
              required
              placeholder="Jane Smith"
              value={fullName}
              onChange={(e) => { setFullName(e.target.value); }}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { setOpen(false); }}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !fullName.trim()}>
              {isPending && <Loader2Icon className="animate-spin" aria-hidden />}
              {isPending ? 'Signing…' : 'Sign & continue'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
