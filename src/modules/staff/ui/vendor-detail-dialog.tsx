'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/ui/shadcn/dialog';
import { formatMoneyExact } from '@/shared/lib/format/currency';
import type { UserDirectoryRow } from '../types';

export function VendorDetailDialog({
  row,
  onClose,
}: {
  row: UserDirectoryRow;
  onClose: () => void;
}) {
  const detail = row.vendorDetail;

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="text-hunter-deep font-serif text-xl">{row.name}</DialogTitle>
          <DialogDescription>{row.showName} · Vendor</DialogDescription>
        </DialogHeader>

        <div>
          <p className="text-ink-deep mb-1.5 text-[12px] font-bold tracking-[.06em] uppercase">
            Booth &amp; items purchased
          </p>
          {!detail || detail.items.length === 0 ? (
            <p className="text-[13.5px] text-[#7A8781] italic">
              No booth space or items reserved yet.
            </p>
          ) : (
            <ul className="divide-y divide-[#EDF0EE] rounded-lg border border-[#EDF0EE]">
              {detail.items.map((item, i) => (
                <li
                  key={`${item.label}-${String(i)}`}
                  className="flex items-center justify-between gap-3 px-3 py-2 text-[13px]"
                >
                  <span className="text-ink-deep">
                    {item.label}
                    {item.qty > 1 && <span className="text-[#98A29D]"> × {item.qty}</span>}
                  </span>
                  <span className="text-[#5A6B63]">{formatMoneyExact(item.amount)}</span>
                </li>
              ))}
              <li className="flex items-center justify-between gap-3 px-3 py-2 text-[13px] font-bold">
                <span>Total</span>
                <span>{formatMoneyExact(detail.total)}</span>
              </li>
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
