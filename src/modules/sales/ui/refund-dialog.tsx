'use client';

import { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/shared/ui/shadcn/dialog';
import { DangerButton, GhostButton } from '@/shared/ui/organizer/buttons';
import { cn } from '@/shared/lib/utils';
import { formatMoneyExact } from '@/shared/lib/format/currency';
import { formatTimestamp } from '@/shared/lib/format/date';
import { REFUND_AMOUNT_EPSILON } from '@/modules/sales/constants';
import {
  useRefundSale,
  useRefundAdditionalCharge,
} from '@/modules/sales/hooks/use-sales-mutations';
import type { SaleRow } from '@/modules/sales/types';
import {
  buildRefundTargets,
  defaultRefundTargetKey,
} from '@/modules/sales/utils/additional-charges';
import { AmountField } from '@/modules/sales/ui/amount-field';

export function RefundDialog({
  showId,
  sale,
  canViewMoney,
  onClose,
}: {
  showId: string;
  sale: SaleRow;
  canViewMoney: boolean;
  onClose: () => void;
}) {
  const targets = useMemo(() => buildRefundTargets(sale), [sale]);
  const [targetKey, setTargetKey] = useState(() => defaultRefundTargetKey(targets));
  const target = targets.find((t) => t.key === targetKey) ?? targets[0];
  const maxRefundable = target?.maxRefundable ?? 0;

  const [amount, setAmount] = useState(maxRefundable.toFixed(2));
  // One id per additional-charge refund attempt, sent as the Stripe
  // idempotency key: a replayed submit can't refund twice. A new amount or
  // charge is a new attempt, and so is a retry after a failure.
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());
  const refundOriginal = useRefundSale();
  const refundCharge = useRefundAdditionalCharge();
  const isPending = refundOriginal.isPending || refundCharge.isPending;

  const parsedAmount = Number.parseFloat(amount);
  const valid =
    Number.isFinite(parsedAmount) &&
    parsedAmount > 0 &&
    parsedAmount <= maxRefundable + REFUND_AMOUNT_EPSILON;

  const hasAdditionalCharges = targets.length > 1;

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
            {target?.chargeId ? (
              <>
                Up to {formatMoneyExact(maxRefundable)} can still be refunded on this additional
                charge — its platform fee is always held back.
              </>
            ) : (
              <>
                Up to {formatMoneyExact(maxRefundable)} can still be refunded on the original
                payment — the {formatMoneyExact(sale.feeTotal)} platform fee is always held back.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {hasAdditionalCharges && (
          <fieldset>
            <legend className="mb-1.5 block text-[12px] font-bold tracking-[.08em] text-[#8A94A3] uppercase">
              What to refund
            </legend>
            <div className="rounded-[10px] border border-[#E7EAEE]">
              {targets.map((t) => {
                const disabled = t.maxRefundable <= 0;
                return (
                  <label
                    key={t.key}
                    className={cn(
                      'flex items-center gap-3 border-b border-[#E7EAEE] px-3.5 py-2.5 text-[13.5px] last:border-b-0',
                      disabled ? 'cursor-not-allowed text-[#8A94A3]' : 'cursor-pointer',
                      t.key === targetKey && !disabled && 'bg-[#FBFCFD]',
                    )}
                  >
                    <input
                      type="radio"
                      name="refund-target"
                      value={t.key}
                      checked={t.key === targetKey}
                      disabled={disabled}
                      onChange={() => {
                        setTargetKey(t.key);
                        setAmount(t.maxRefundable.toFixed(2));
                        setRequestId(crypto.randomUUID());
                      }}
                      className="accent-[#146A47]"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-[#101828]">
                        {t.chargeId
                          ? `Additional charge ${String(t.chargeNumber)}`
                          : 'Original payment'}
                      </span>
                      <span className="block text-[12px] text-[#8A94A3]">
                        {t.createdAt ? formatTimestamp(t.createdAt) : '—'}
                        {canViewMoney && ` · ${formatMoneyExact(t.amount)} charged`}
                      </span>
                    </span>
                    <span className="flex-none font-mono text-[12.5px]">
                      {disabled ? 'Nothing left' : `${formatMoneyExact(t.maxRefundable)} left`}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        )}

        <AmountField
          id="refund-amount"
          label="Refund amount"
          value={amount}
          onChange={(value) => {
            setAmount(value);
            setRequestId(crypto.randomUUID());
          }}
          max={maxRefundable}
          error={
            valid
              ? undefined
              : `Enter an amount between $0.01 and ${formatMoneyExact(maxRefundable)}.`
          }
        />

        <DialogFooter>
          <GhostButton type="button" onClick={onClose}>
            Cancel
          </GhostButton>
          <DangerButton
            type="button"
            disabled={!valid || isPending}
            onClick={() => {
              const base = {
                showId,
                saleType: sale.saleType,
                saleId: sale.id,
                amount: parsedAmount,
              };
              if (target?.chargeId) {
                refundCharge.mutate(
                  { ...base, chargeId: target.chargeId, requestId },
                  {
                    onSuccess: onClose,
                    onError: () => {
                      setRequestId(crypto.randomUUID());
                    },
                  },
                );
              } else {
                refundOriginal.mutate(base, { onSuccess: onClose });
              }
            }}
          >
            {isPending ? 'Refunding…' : `Refund ${formatMoneyExact(parsedAmount || 0)}`}
          </DangerButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
