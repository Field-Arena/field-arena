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
import { formatMoney } from '@/shared/lib/format/currency';
import { useApplyToVendorShow } from '@/modules/vendors/hooks/use-vendor-mutations';
import type { BookableShow } from '@/modules/vendors/types';

/**
 * "Apply for this space" — the real, non-money half of vendor-apply.html's
 * form, for a signed-in platform Vendor instead of an anonymous public page.
 * Submits a pending vendor_bookings row for an organizer to review; there is
 * no payment step here (see listBookableShows's doc comment for why).
 */
export function VendorApplyDialog({ show }: { show: BookableShow }) {
  const [open, setOpen] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [contactName, setContactName] = useState('');
  const [productsOffered, setProductsOffered] = useState('');
  const [qtyById, setQtyById] = useState<Record<string, number>>({});

  const { mutate, isPending } = useApplyToVendorShow();

  const cart = show.items
    .map((item) => ({ item, qty: qtyById[item.id] ?? 0 }))
    .filter(({ qty }) => qty > 0);

  function reset() {
    setBusinessName('');
    setContactName('');
    setProductsOffered('');
    setQtyById({});
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" size="sm">
          Apply for a space
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-hunter-deep">
            Apply to vend at {show.showName}
          </DialogTitle>
          <DialogDescription>
            {show.orgName}
            {show.showDate && ` · ${show.showDate}`} — submitted for the organizer&apos;s review.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            mutate(
              {
                showId: show.showId,
                businessName,
                contactName: contactName || undefined,
                productsOffered: productsOffered || undefined,
                items: cart.map(({ item, qty }) => ({ vendorItemId: item.id, qty })),
              },
              { onSuccess: () => { setOpen(false); reset(); } }
            );
          }}
          className="space-y-4"
          noValidate
        >
          <div className="space-y-1.5">
            <Label htmlFor="va-business">Business / farm name</Label>
            <Input
              id="va-business"
              required
              placeholder="Blue Ridge Tack Co."
              value={businessName}
              onChange={(e) => { setBusinessName(e.target.value); }}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="va-contact-name">Contact name (optional)</Label>
            <Input
              id="va-contact-name"
              placeholder="Jane Smith"
              value={contactName}
              onChange={(e) => { setContactName(e.target.value); }}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="va-products">Products / services offered (optional)</Label>
            <Input
              id="va-products"
              placeholder="Tack, apparel, custom leatherwork"
              value={productsOffered}
              onChange={(e) => { setProductsOffered(e.target.value); }}
            />
          </div>

          <div className="space-y-2">
            <Label>Booth space</Label>
            {show.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 text-[13.5px]">
                <span className="min-w-0 flex-1">
                  {item.name}
                  <span className="ml-2 text-[#7A8781]">{formatMoney(item.price)}</span>
                </span>
                <Input
                  type="number"
                  min={0}
                  max={item.remaining ?? undefined}
                  className="w-20"
                  value={qtyById[item.id] ?? 0}
                  onChange={(e) => {
                    const n = Math.max(0, Number(e.target.value) || 0);
                    setQtyById((prev) => ({ ...prev, [item.id]: n }));
                  }}
                />
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => { setOpen(false); }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !businessName.trim() || cart.length === 0}>
              {isPending && <Loader2Icon className="animate-spin" aria-hidden />}
              {isPending ? 'Submitting…' : 'Submit application'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
