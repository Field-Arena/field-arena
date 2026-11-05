import 'server-only';
import type Stripe from 'stripe';
import { createAdminClient } from '@/shared/lib/supabase/admin';
import { getStripeClient } from '@/shared/lib/stripe';
import { recordSaleEvent } from '@/modules/payouts/data/events';
import type { SaleType } from '@/modules/payouts/types';

type AdminClient = ReturnType<typeof createAdminClient>;

interface FoundSale {
  saleType: SaleType;
  table: 'orders' | 'vendor_bookings';
  id: string;
  showId: string;
  amountTotal: number;
  feeTotal: number;
  refundedAmount: number;
  settlement: string;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

const idOf = (ref: string | { id: string } | null | undefined): string | null =>
  !ref ? null : typeof ref === 'string' ? ref : ref.id;

async function findSaleByPaymentIntent(
  admin: AdminClient,
  paymentIntentId: string,
): Promise<FoundSale | null> {
  const { data: order, error: orderError } = await admin
    .from('orders')
    .select('id, show_id, amount_total, fee_total, refunded_amount, settlement')
    .eq('stripe_payment_intent_id', paymentIntentId)
    .maybeSingle();
  if (orderError) throw orderError;
  if (order) {
    return {
      saleType: 'order',
      table: 'orders',
      id: order.id,
      showId: order.show_id,
      amountTotal: order.amount_total,
      feeTotal: order.fee_total ?? 0,
      refundedAmount: order.refunded_amount ?? 0,
      settlement: order.settlement,
    };
  }
  const { data: booking, error: bookingError } = await admin
    .from('vendor_bookings')
    .select('id, show_id, amount_total, fee_total, refunded_amount, settlement')
    .eq('stripe_payment_intent_id', paymentIntentId)
    .maybeSingle();
  if (bookingError) throw bookingError;
  if (!booking) return null;
  return {
    saleType: 'vendor_booking',
    table: 'vendor_bookings',
    id: booking.id,
    showId: booking.show_id,
    amountTotal: booking.amount_total ?? 0,
    feeTotal: booking.fee_total ?? 0,
    refundedAmount: booking.refunded_amount ?? 0,
    settlement: booking.settlement,
  };
}

/* A charge was refunded. Refunds made in this app are already recorded with
 * their Stripe id; this picks up the ones made any other way (the Stripe
 * dashboard) and dates every one by the moment Stripe made it.
 *
 * Field & Arena's fee is never refunded to the rider out of the organizer's
 * share, so what comes off the organizer is capped at the sale amount minus
 * the fee. A refund of the fee itself is the platform's own cost. */
export async function handleChargeRefunded(charge: Stripe.Charge): Promise<void> {
  const paymentIntentId = idOf(charge.payment_intent);
  if (!paymentIntentId) return;

  const admin = createAdminClient();
  const sale = await findSaleByPaymentIntent(admin, paymentIntentId);
  if (!sale) {
    console.error('[stripe-webhook] refund for a payment we have no sale for', charge.id);
    return;
  }
  if (sale.settlement !== 'platform') return;

  const { data: existing, error: existingError } = await admin
    .from('sale_events')
    .select('amount, stripe_ref')
    .eq('sale_type', sale.saleType)
    .eq('sale_id', sale.id)
    .eq('kind', 'refund');
  if (existingError) throw existingError;

  const known = new Set(existing.map((e) => e.stripe_ref));
  let counted = existing.reduce((sum, e) => sum + e.amount, 0);
  const ceiling = round2(sale.amountTotal - sale.feeTotal);

  const stripe = getStripeClient();
  const refunds = await stripe.refunds.list({ charge: charge.id, limit: 100 });
  const ordered = [...refunds.data].sort((a, b) => a.created - b.created);
  for (const refund of ordered) {
    if (refund.status === 'failed' || refund.status === 'canceled') continue;
    if (known.has(refund.id)) continue;
    const remaining = Math.max(0, round2(ceiling - counted));
    const amount = Math.min(round2(refund.amount / 100), remaining);
    const result = await recordSaleEvent(admin, {
      saleType: sale.saleType,
      saleId: sale.id,
      showId: sale.showId,
      kind: 'refund',
      amount,
      stripeRef: refund.id,
      occurredAt: new Date(refund.created * 1000),
    });
    if (result === 'recorded') counted = round2(counted + amount);
  }

  // Keep the sale's running refunded total in step, so the P&L and Event
  // Sales also reflect a refund that was made outside this app.
  if (counted > sale.refundedAmount) {
    const { error } = await admin
      .from(sale.table)
      .update({ refunded_amount: counted })
      .eq('id', sale.id)
      .lt('refunded_amount', counted);
    if (error) throw error;
  }
}

/* A chargeback was opened. Stripe takes the money back from the platform at
 * once, and the organizer carries it, so it comes off their statement. */
export async function handleDisputeCreated(dispute: Stripe.Dispute): Promise<void> {
  const paymentIntentId = idOf(dispute.payment_intent);
  if (!paymentIntentId) {
    console.error('[stripe-webhook] dispute without a payment intent', dispute.id);
    return;
  }
  const admin = createAdminClient();
  const sale = await findSaleByPaymentIntent(admin, paymentIntentId);
  if (!sale) {
    console.error('[stripe-webhook] dispute for a payment we have no sale for', dispute.id);
    return;
  }
  if (sale.settlement !== 'platform') return;
  await recordSaleEvent(admin, {
    saleType: sale.saleType,
    saleId: sale.id,
    showId: sale.showId,
    kind: 'dispute',
    amount: round2(dispute.amount / 100),
    stripeRef: dispute.id,
    occurredAt: new Date(dispute.created * 1000),
  });
}

/* A chargeback closed. If it was won, Stripe returns the money, so the
 * deduction is reversed. A lost one simply stays deducted. */
export async function handleDisputeClosed(dispute: Stripe.Dispute): Promise<void> {
  if (dispute.status !== 'won') return;
  const admin = createAdminClient();
  const { data: opened, error } = await admin
    .from('sale_events')
    .select('sale_type, sale_id, show_id')
    .eq('kind', 'dispute')
    .eq('stripe_ref', dispute.id)
    .maybeSingle();
  if (error) throw error;
  // Never credit back a dispute we did not deduct.
  if (!opened) return;
  await recordSaleEvent(admin, {
    saleType: opened.sale_type as SaleType,
    saleId: opened.sale_id,
    showId: opened.show_id,
    kind: 'dispute_reversal',
    amount: round2(dispute.amount / 100),
    stripeRef: dispute.id,
    occurredAt: new Date(),
  });
}
