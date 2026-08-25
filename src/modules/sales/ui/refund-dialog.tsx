'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/shared/ui/shadcn/dialog';
import { DangerButton, GhostButton } from '@/shared/ui/organizer/buttons';
import { formatMoneyExact } from '@/shared/lib/format/currency';
import { REFUND_AMOUNT_EPSILON } from '@/modules/sales/constants';
import { useRefundSale } from '@/modules/sales/hooks/use-sales-mutations';
import type { SaleRow } from '@/modules/sales/types';
import { AmountField } from '@/modules/sales/ui/amount-field';

export function RefundDialog({
  showId,
  sale,
  onClose,
}: {
  showId: string;
  sale: SaleRow;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState(sale.maxRefundable.toFixed(2));
  const refund = useRefundSale();

  const parsedAmount = Number.parseFloat(amount);
  const valid =
    Number.isFinite(parsedAmount) &&
    parsedAmount > 0 &&
    parsedAmount <= sale.maxRefundable + REFUND_AMOUNT_EPSILON;

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Refund {sale.customer}</DialogTitle>
          <DialogDescription>
            Up to {formatMoneyExact(sale.maxRefundable)} can still be refunded on this sale — the{' '}
            {formatMoneyExact(sale.feeTotal)} platform fee is always held back.
          </DialogDescription>
        </DialogHeader>

        <AmountField
          id="refund-amount"
          label="Refund amount"
          value={amount}
          onChange={setAmount}
          max={sale.maxRefundable}
          error={
            valid
              ? undefined
              : `Enter an amount between $0.01 and ${formatMoneyExact(sale.maxRefundable)}.`
          }
        />

        <DialogFooter>
          <GhostButton type="button" onClick={onClose}>
            Cancel
          </GhostButton>
          <DangerButton
            type="button"
            disabled={!valid || refund.isPending}
            onClick={() => {
              refund.mutate(
                { showId, saleType: sale.saleType, saleId: sale.id, amount: parsedAmount },
                { onSuccess: onClose },
              );
            }}
          >
            {refund.isPending ? 'Refunding…' : `Refund ${formatMoneyExact(parsedAmount || 0)}`}
          </DangerButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
