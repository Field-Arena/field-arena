import { calcPlatformFeeFlat8 } from '@/shared/lib/fees';
import { additionalChargeRefunded } from '@/shared/lib/sales-math';
import type { RefundTarget, SaleAdditionalCharge, SaleRow } from '@/modules/sales/types';

/* One element of `orders.additional_charges` / `vendor_bookings.
 * additional_charges`, read loosely: the column is jsonb and older elements
 * only carry {id, amount, createdAt}. Unknown keys are preserved by callers
 * that rewrite an element, so this is only ever used to READ one. */
export type RawAdditionalCharge = Record<string, unknown>;

export function roundCents(value: number): number {
  return Math.round(value * 100) / 100;
}

export function isRawCharge(value: unknown): value is RawAdditionalCharge {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function rawCharges(raw: unknown): RawAdditionalCharge[] {
  return Array.isArray(raw) ? raw.filter(isRawCharge) : [];
}

export function chargeAmount(charge: RawAdditionalCharge): number {
  const n = Number(charge.amount);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/* The platform's cut of an additional charge — held back on refund exactly
 * like fee_total on the original payment, which is also what keeps the
 * organizer-transfer reversal within the transfer (transfer = amount − fee).
 * chargeMore records it as `fee`; elements written before that fall back to
 * the flat 8% chargeMore has always applied. */
export function chargeFee(charge: RawAdditionalCharge): number {
  const recorded = Number(charge.fee);
  if (Number.isFinite(recorded) && recorded >= 0) return recorded;
  return roundCents(calcPlatformFeeFlat8(chargeAmount(charge)));
}

export function chargeMaxRefundable(charge: RawAdditionalCharge): number {
  const left = chargeAmount(charge) - chargeFee(charge) - additionalChargeRefunded(charge);
  return roundCents(Math.max(0, left));
}

export function parseAdditionalCharges(raw: unknown): SaleAdditionalCharge[] {
  return rawCharges(raw)
    .filter((c) => typeof c.id === 'string')
    .map((c) => ({
      id: c.id as string,
      amount: chargeAmount(c),
      refunded: additionalChargeRefunded(c),
      maxRefundable: chargeMaxRefundable(c),
      createdAt: typeof c.createdAt === 'string' ? c.createdAt : null,
    }));
}

/* What the refund dialog can refund on one sale: the original payment, then
 * each additional charge in the order it was made. */
export function buildRefundTargets(sale: SaleRow): RefundTarget[] {
  return [
    {
      key: 'original',
      chargeId: null,
      chargeNumber: 0,
      amount: sale.amountTotal,
      maxRefundable: sale.maxRefundable,
      createdAt: sale.date,
    },
    ...sale.additionalCharges.map((charge, i) => ({
      key: charge.id,
      chargeId: charge.id,
      chargeNumber: i + 1,
      amount: charge.amount,
      maxRefundable: charge.maxRefundable,
      createdAt: charge.createdAt,
    })),
  ];
}

// The first target with something left to refund (the original if none).
export function defaultRefundTargetKey(targets: RefundTarget[]): string {
  return (targets.find((t) => t.maxRefundable > 0) ?? targets[0])?.key ?? 'original';
}
