import type { SALE_EVENT_KINDS } from '@/modules/payouts/constants';

export type SaleEventKind = (typeof SALE_EVENT_KINDS)[number];

export type SaleType = 'order' | 'vendor_booking';

export interface SaleEventInput {
  saleType: SaleType;
  saleId: string;
  showId: string;
  kind: SaleEventKind;
  /** Always positive; the kind decides the direction. */
  amount: number;
  /** Platform fee included in `amount` (payments only). */
  fee?: number;
  /** Stripe payment intent, refund or dispute id. */
  stripeRef: string | null | undefined;
  occurredAt: Date | string;
}

/* recorded  = a new dated event was stored
 * duplicate = this exact Stripe reference was already recorded
 * skipped   = not real Stripe money (no reference, demo data, or zero) */
export type RecordResult = 'recorded' | 'duplicate' | 'skipped';

export interface SaleEventRow {
  id: string;
  org_id: string;
  show_id: string;
  sale_type: string;
  sale_id: string;
  kind: string;
  amount: number;
  fee: number;
  stripe_ref: string;
  occurred_at: string;
}

export interface StatementShow {
  id: string;
  name: string;
  /** YYYY-MM-DD; holdback on a show is released once this date has passed. */
  endDate: string | null;
}

export interface StatementLine {
  occurredAt: string;
  kind: SaleEventKind;
  showId: string;
  showName: string;
  saleType: SaleType;
  saleId: string;
  stripeRef: string;
  /** What the customer paid or what was taken back. */
  gross: number;
  /** Field & Arena's fee withheld (payments only). */
  fee: number;
  /** Effect on what the organizer is owed: positive adds, negative subtracts. */
  effect: number;
}

export interface Statement {
  periodStart: string;
  periodEnd: string;
  lines: StatementLine[];
  /** This period's money, before any holdback. */
  totals: {
    payments: number;
    platformFees: number;
    additionalCharges: number;
    refunds: number;
    disputes: number;
    disputeReversals: number;
    subtotal: number;
  };
  holdbackPercent: number | null;
  /** Holdback newly held this period (negative when earlier holdback is released). */
  holdbackChange: number;
  /** Holdback still held at the end of the period. */
  holdbackHeld: number;
  /** Owed (or, if negative, carried as a debt) at the start of the period. */
  broughtForward: number;
  /** Owed at the end of the period, after holdback and earlier payouts. */
  totalOwed: number;
  /** What would be sent now; 0 when under the minimum or not positive. */
  toSend: number;
  /** Already sent in earlier statements. */
  paidBefore: number;
}
