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
import { PrimaryButton, GhostButton } from '@/shared/ui/organizer/buttons';
import { formatMoneyExact } from '@/shared/lib/format/currency';
import { useChargeMore } from '@/modules/sales/hooks/use-sales-mutations';
import type { SaleRow } from '@/modules/sales/types';
import { AmountField } from '@/modules/sales/ui/amount-field';

export function ChargeMoreDialog({
  showId,
  sale,
  onClose,
}: {
  showId: string;
  sale: SaleRow;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState('');
  const charge = useChargeMore();

  const parsedAmount = Number.parseFloat(amount);
  const valid = Number.isFinite(parsedAmount) && parsedAmount > 0;

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Charge {sale.customer} more</DialogTitle>
          <DialogDescription>
            Charges the card saved at checkout
            {sale.additionalChargesTotal > 0 &&
              ` — ${formatMoneyExact(sale.additionalChargesTotal)} already charged this way`}
            .
          </DialogDescription>
        </DialogHeader>

        <AmountField
          id="charge-amount"
          label="Amount to charge"
          value={amount}
          onChange={setAmount}
          placeholder="0.00"
        />

        <DialogFooter>
          <GhostButton type="button" onClick={onClose}>
            Cancel
          </GhostButton>
          <PrimaryButton
            type="button"
            disabled={!valid || charge.isPending}
            onClick={() => {
              charge.mutate(
                { showId, saleType: sale.saleType, saleId: sale.id, amount: parsedAmount },
                { onSuccess: onClose },
              );
            }}
          >
            {charge.isPending ? 'Charging…' : `Charge ${formatMoneyExact(parsedAmount || 0)}`}
          </PrimaryButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
