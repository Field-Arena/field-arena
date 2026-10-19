import { z } from 'zod';
import { MAX_CHARGE_MORE_AMOUNT } from './constants';

const SALE_TABLE_KEYS = ['order', 'vendor_booking'] as const;

/** True when the amount has no more than two decimal places (whole cents). */
function isWholeCents(value: number): boolean {
  return Math.abs(value * 100 - Math.round(value * 100)) < 1e-6;
}

const CENTS_MESSAGE = 'Amounts can have at most two decimal places';

const saleActionShape = {
  showId: z.uuid(),
  saleType: z.enum(SALE_TABLE_KEYS),
  saleId: z.uuid(),
};

export const refundSaleSchema = z.object({
  ...saleActionShape,
  amount: z.coerce
    .number()
    .positive('Enter an amount to refund')
    .refine(isWholeCents, CENTS_MESSAGE),
});

export type RefundSaleInput = z.input<typeof refundSaleSchema>;

export const refundAdditionalChargeSchema = z.object({
  ...saleActionShape,
  // The additional charge's PaymentIntent id — its `id` in additional_charges.
  chargeId: z.string().regex(/^pi_[A-Za-z0-9_]+$/, 'Unknown additional charge'),
  amount: z.coerce
    .number()
    .positive('Enter an amount to refund')
    .refine(isWholeCents, CENTS_MESSAGE),
  // Generated once by the client per refund attempt: the Stripe idempotency
  // key and the reservation's identity, so a replayed request never refunds
  // twice.
  requestId: z.uuid(),
});

export type RefundAdditionalChargeInput = z.input<typeof refundAdditionalChargeSchema>;

export const chargeMoreSchema = z.object({
  ...saleActionShape,
  amount: z.coerce
    .number()
    .positive('Enter an amount to charge')
    .max(
      MAX_CHARGE_MORE_AMOUNT,
      `A single charge can't exceed $${MAX_CHARGE_MORE_AMOUNT.toLocaleString('en-US')}`,
    )
    .refine(isWholeCents, CENTS_MESSAGE),
  // Generated once by the client per charge attempt and used as the Stripe
  // idempotency key, so a retried request can never charge the card twice.
  requestId: z.uuid(),
});

export type ChargeMoreInput = z.input<typeof chargeMoreSchema>;
