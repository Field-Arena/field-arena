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
import { MAX_CHARGE_MORE_AMOUNT } from '@/modules/sales/constants';
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
  // One id per charge attempt, sent as the Stripe idempotency key: a retried
  // submit of the same amount can't double-charge. A new amount is a new
  // attempt, so it gets a fresh id, and so does a retry after a failure.
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());
  const charge = useChargeMore();

  const parsedAmount = Number.parseFloat(amount);
  const valid =
    Number.isFinite(parsedAmount) && parsedAmount > 0 && parsedAmount <= MAX_CHARGE_MORE_AMOUNT;

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
          onChange={(value) => {
            setAmount(value);
            setRequestId(crypto.randomUUID());
          }}
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
                {
                  showId,
                  saleType: sale.saleType,
                  saleId: sale.id,
                  amount: parsedAmount,
                  requestId,
                },
                {
                  onSuccess: onClose,
                  // Stripe replays a declined result for the same key, so a
                  // retry after a decline must be a new attempt.
                  onError: () => {
                    setRequestId(crypto.randomUUID());
                  },
                },
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
