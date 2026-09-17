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

        <div className="rounded-[10px] border border-[#E9EDEB]">
          {sale.items.length === 0 ? (
            <p className="px-3.5 py-3 text-[13px] text-[#98A29D]">
              No itemized line items on this sale.
            </p>
          ) : (
            sale.items.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-3 border-b border-[#E9EDEB] px-3.5 py-2.5 text-[13.5px] last:border-b-0"
              >
                <span className="text-ink-deep">
                  {item.label}
                  {item.qty > 1 && <span className="text-[#98A29D]"> × {item.qty}</span>}
                </span>
                {canViewMoney && (
                  <span className="text-ink-deep flex-none font-mono">
                    {formatMoneyExact(item.amount)}
                  </span>
                )}
              </div>
            ))
          )}
          {canViewMoney && (
            <div className="flex items-center justify-between border-t border-[#E9EDEB] px-3.5 py-2.5 text-[13.5px] font-bold">
              <span>Total</span>
              <span className="font-mono">{formatMoneyExact(sale.amountTotal)}</span>
            </div>
          )}
        </div>

        {canViewMoney && (
          <StatusBadge tone={STATUS_TONE[sale.status]} className="w-fit">
            {STATUS_LABEL[sale.status]}
            {sale.status === 'partial' && ` — ${formatMoneyExact(sale.refundedAmount)} refunded`}
          </StatusBadge>
        )}

        {canRefund && (
          <div className="flex flex-wrap gap-2.5">
            <GhostButton
              type="button"
              disabled={sale.maxRefundable <= 0}
              title={sale.maxRefundable <= 0 ? 'Nothing left to refund on this sale' : undefined}
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
