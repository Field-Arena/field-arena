'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/ui/shadcn/dialog';
import { GhostButton } from '@/shared/ui/organizer/buttons';
import { StatusBadge } from '@/shared/ui/status-badge';
import { formatMoneyExact } from '@/shared/lib/format/currency';
import { formatTimestamp } from '@/shared/lib/format/date';
import type { SaleRow } from '@/modules/sales/types';
import { STATUS_TONE, STATUS_LABEL } from '@/modules/sales/ui/event-sales-screen';

export function InvoiceModal({
  sale,
  canRefund,
  canViewMoney,
  onClose,
  onRefund,
  onChargeMore,
}: {
  sale: SaleRow;
  canRefund: boolean;
  canViewMoney: boolean;
  onClose: () => void;
  onRefund: () => void;
  onChargeMore: () => void;
}) {
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{sale.customer}</DialogTitle>
          <DialogDescription>
            {sale.showName} · {sale.type}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-[10px] border border-[#E7EAEE]">
          {sale.items.length === 0 ? (
            <p className="px-3.5 py-3 text-[13px] text-[#8A94A3]">
              No itemized line items on this sale.
            </p>
          ) : (
            sale.items.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-3 border-b border-[#E7EAEE] px-3.5 py-2.5 text-[13.5px] last:border-b-0"
              >
                <span className="text-[#101828]">
                  {item.label}
                  {item.qty > 1 && <span className="text-[#8A94A3]"> × {item.qty}</span>}
                </span>
                {canViewMoney && (
                  <span className="flex-none font-mono text-[#101828]">
                    {formatMoneyExact(item.amount)}
                  </span>
                )}
              </div>
            ))
          )}
          {canViewMoney && (
            <div className="flex items-center justify-between border-t border-[#E7EAEE] px-3.5 py-2.5 text-[13.5px] font-bold">
              <span>Total</span>
              <span className="font-mono">{formatMoneyExact(sale.amountTotal)}</span>
            </div>
          )}
          {canViewMoney &&
            sale.additionalCharges.map((charge, i) => (
              <div
                key={charge.id}
                className="flex items-center justify-between gap-3 border-t border-[#E7EAEE] px-3.5 py-2.5 text-[13.5px]"
              >
                <span className="text-[#101828]">
                  Additional charge {i + 1}
                  {charge.createdAt && (
                    <span className="text-[#8A94A3]"> · {formatTimestamp(charge.createdAt)}</span>
                  )}
                  {charge.refunded > 0 && (
                    <span className="block text-[12px] text-[#8A94A3]">
                      {formatMoneyExact(charge.refunded)} refunded
                    </span>
                  )}
                </span>
                <span className="flex-none font-mono text-[#101828]">
                  {formatMoneyExact(charge.amount)}
                </span>
              </div>
            ))}
        </div>

        {canViewMoney && (
          <StatusBadge tone={STATUS_TONE[sale.status]} className="w-fit">
            {STATUS_LABEL[sale.status]}
            {sale.status === 'partial' &&
              sale.refundedAmount > 0 &&
              ` — ${formatMoneyExact(sale.refundedAmount)} refunded`}
          </StatusBadge>
        )}

        {canRefund && (
          <div className="flex flex-wrap gap-2.5">
            <GhostButton
              type="button"
              disabled={!sale.hasRefundableBalance}
              title={sale.hasRefundableBalance ? undefined : 'Nothing left to refund on this sale'}
              onClick={onRefund}
            >
              Refund charge
            </GhostButton>
            <GhostButton
              type="button"
              disabled={!sale.hasSavedCard}
              title={sale.hasSavedCard ? undefined : 'No saved card on file'}
              onClick={onChargeMore}
            >
              Charge additional amount
            </GhostButton>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
