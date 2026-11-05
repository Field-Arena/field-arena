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
          <DialogTitle className="font-serif text-xl text-[#101828]">{row.name}</DialogTitle>
          <DialogDescription>{row.showName} · Vendor</DialogDescription>
        </DialogHeader>

        <div>
          <p className="mb-1.5 text-[12px] font-bold tracking-[.06em] text-[#101828] uppercase">
            Booth &amp; items purchased
          </p>
          {!detail || detail.items.length === 0 ? (
            <p className="text-[13.5px] text-[#8A94A3] italic">
              No booth space or items reserved yet.
            </p>
          ) : (
            <ul className="divide-y divide-[#EEF1F4] rounded-lg border border-[#EEF1F4]">
              {detail.items.map((item, i) => (
                <li
                  key={`${item.label}-${String(i)}`}
                  className="flex items-center justify-between gap-3 px-3 py-2 text-[13px]"
                >
                  <span className="text-[#101828]">
                    {item.label}
                    {item.qty > 1 && <span className="text-[#8A94A3]"> × {item.qty}</span>}
                  </span>
                  <span className="text-[#475467]">{formatMoneyExact(item.amount)}</span>
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
