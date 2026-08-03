import { z } from 'zod';

const SALE_TABLE_KEYS = ['order', 'vendor_booking'] as const;

const saleActionShape = {
  showId: z.uuid(),
  saleType: z.enum(SALE_TABLE_KEYS),
  saleId: z.uuid(),
};

export const refundSaleSchema = z.object({
  ...saleActionShape,
  amount: z.coerce.number().positive('Enter an amount to refund'),
});

export type RefundSaleInput = z.input<typeof refundSaleSchema>;

export const chargeMoreSchema = z.object({
  ...saleActionShape,
  amount: z.coerce.number().positive('Enter an amount to charge'),
});

export type ChargeMoreInput = z.input<typeof chargeMoreSchema>;
