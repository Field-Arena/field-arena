import 'server-only';
import type Stripe from 'stripe';
import { createAdminClient } from '@/shared/lib/supabase/admin';
import { getStripeClient } from '@/shared/lib/stripe';
import {
  finalizeOrder,
  markOrderForReview,
  markOrderPaymentFailed,
  saveOffSessionCard,
} from '@/modules/riders';
import {
  finalizeVendorBookingPayment,
  markVendorBookingForReview,
  resolvePaidBookingPricing,
  saveVendorOffSessionCard,
} from '@/modules/vendors';
import { additionalChargeRefunded } from '@/shared/lib/sales-math';
import { updateAdditionalChargesLedger } from '@/modules/sales/data/additional-charges-ledger';
import { chargeAmount, roundCents } from '@/modules/sales/utils/additional-charges';

// Stripe webhook fulfilment. The route handler (app/api/webhooks/stripe)
// verifies the signature and maps a thrown error to a non-2xx response; every
// event-specific write lives here.

type AdminClient = ReturnType<typeof createAdminClient>;

export async function handleStripeEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded':
      await handleCheckoutSessionPaid(event.data.object);
      break;
    case 'checkout.session.expired':
      await handleCheckoutSessionExpired(event.data.object);
      break;
    case 'checkout.session.async_payment_failed':
      await handleCheckoutSessionAsyncPaymentFailed(event.data.object);
      break;
    case 'charge.refunded':
      await handleChargeRefunded(event.data.object);
      break;
    case 'charge.dispute.created':
      await handleDisputeCreated(event.data.object);
      break;
    default:
      break;
  }
}

/* The session can no longer be paid, so its still-pending rider order is
 * abandoned now rather than waiting for the hourly cron. Vendor bookings have
 * no abandoned state — the booking simply stays payable. */
async function handleCheckoutSessionExpired(session: Stripe.Checkout.Session): Promise<void> {
  if (session.metadata?.bookingId) return;
  const orderId = session.metadata?.orderId;
  if (!orderId) return;

  const admin = createAdminClient();
  const { error } = await admin
    .from('orders')
    .update({ status: 'abandoned' })
    .eq('id', orderId)
    .eq('status', 'pending');
  if (error) throw error;
}

async function handleCheckoutSessionPaid(session: Stripe.Checkout.Session): Promise<void> {
  if (session.metadata?.bookingId) {
    await handleVendorBookingCheckoutPaid(session);
    return;
  }
  await handleRiderOrderCheckoutPaid(session);
}

async function handleRiderOrderCheckoutPaid(session: Stripe.Checkout.Session): Promise<void> {
  const orderId = session.metadata?.orderId;
  if (!orderId) {
    console.error('[stripe-webhook] checkout.session missing metadata.orderId', session.id);
    return;
  }
  if (session.payment_status !== 'paid') return;

  const admin = createAdminClient();

  const { data: order, error: orderError } = await admin
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .maybeSingle();
  if (orderError) throw orderError;
  if (!order) {
    console.error('[stripe-webhook] order not found for session', session.id, orderId);
    return;
  }

  if (order.status === 'paid') return;
  if (order.status === 'failed') {
    console.error('[stripe-webhook] order already set aside for review', orderId, session.id);
    return;
  }

  /* Never fulfil a payment that doesn't match the order. Park the order for
   * review first (a failed write throws -> 500 -> Stripe retries), and only
   * then acknowledge the event. */
  if (session.amount_total !== Math.round(order.amount_total * 100)) {
    console.error(
      '[stripe-webhook] amount mismatch for order — set aside for review',
      orderId,
      session.amount_total,
      order.amount_total,
    );
    await markOrderForReview(admin, order.id);
    return;
  }

  const { data: rider, error: riderError } = await admin
    .from('riders')
    .select('*')
    .eq('id', order.rider_id)
    .maybeSingle();
  if (riderError) throw riderError;
  if (!rider) {
    console.error('[stripe-webhook] rider not found for order', orderId);
    return;
  }

  const paymentIntentId = paymentIntentIdOf(session.payment_intent);
  if (paymentIntentId) {
    const stripe = getStripeClient();
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId).catch(() => null);
    if (paymentIntent) await saveOffSessionCard(admin, order.id, paymentIntent);
  }

  let result;
  try {
    result = await finalizeOrder(admin, order, rider, paymentIntentId);
  } catch (cause) {
    console.error('[stripe-webhook] finalizeOrder failed for order', orderId, cause);
    throw cause;
  }
  /* Another process claimed the order and is still creating entries (or its
   * attempt rolled back). That is transient: answer 500 so Stripe redelivers
   * — the retry either sees it 'paid' and stops, or claims it itself. */
  if (!result.ok && result.reason === 'processing') {
    throw new Error(`Order ${orderId} is mid-fulfilment elsewhere; retry later.`);
  }
}

async function handleVendorBookingCheckoutPaid(session: Stripe.Checkout.Session): Promise<void> {
  const bookingId = session.metadata?.bookingId;
  if (!bookingId) return;
  if (session.payment_status !== 'paid') return;

  const admin = createAdminClient();

  const { data: booking, error: bookingError } = await admin
    .from('vendor_bookings')
    .select('*')
    .eq('id', bookingId)
    .maybeSingle();
  if (bookingError) throw bookingError;
  if (!booking) {
    console.error('[stripe-webhook] vendor booking not found for session', session.id, bookingId);
    return;
  }

  if (booking.status === 'paid' || booking.status === 'review') return;

  const paymentIntentId = paymentIntentIdOf(session.payment_intent);

  if (booking.status === 'rejected') {
    console.error(
      '[stripe-webhook] payment received for a rejected vendor booking — set aside for review',
      bookingId,
      session.id,
    );
    await markVendorBookingForReview(
      admin,
      booking.id,
      `Payment ${paymentIntentId ?? session.id} received after the application was rejected — refund it.`,
      paymentIntentId,
    );
    return;
  }

  // H14: matched against what this session was priced at, not today's catalog.
  const priced = await resolvePaidBookingPricing(admin, booking, session.id);

  if (!priced || session.amount_total !== Math.round(priced.total * 100)) {
    // H13: not fulfilled, and no longer payable until the organizer reconciles.
    console.error(
      '[stripe-webhook] amount mismatch for vendor booking — set aside for review',
      bookingId,
      session.amount_total,
      priced?.total ?? 'superseded session',
    );
    await markVendorBookingForReview(
      admin,
      booking.id,
      priced
        ? `Stripe charged ${String(session.amount_total)}¢ but checkout priced ${String(Math.round(priced.total * 100))}¢ (session ${session.id}).`
        : `Payment arrived on a superseded checkout session ${session.id}.`,
      paymentIntentId,
    );
    return;
  }

  if (paymentIntentId) {
    const stripe = getStripeClient();
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId).catch(() => null);
    if (paymentIntent) await saveVendorOffSessionCard(admin, booking.id, paymentIntent);
  }

  try {
    await finalizeVendorBookingPayment(admin, booking, priced, paymentIntentId);
  } catch (cause) {
    console.error(
      '[stripe-webhook] finalizeVendorBookingPayment failed for booking',
      bookingId,
      cause,
    );
    throw cause;
  }
}

function paymentIntentIdOf(value: string | { id: string } | null | undefined): string | null {
  if (!value) return null;
  return typeof value === 'string' ? value : value.id;
}

type SaleTable = 'orders' | 'vendor_bookings';

interface SaleRef {
  table: SaleTable;
  id: string;
  amountTotal: number;
  feeTotal: number;
  refundedAmount: number;
  reviewReason: string | null;
}

/* The order or vendor booking a PaymentIntent paid for. Additional charges
 * ("charge more") are their own PaymentIntents and are not found here. */
async function findSaleByPaymentIntent(
  admin: AdminClient,
  paymentIntentId: string,
): Promise<SaleRef | null> {
  for (const table of ['orders', 'vendor_bookings'] as const) {
    const { data, error } = await admin
      .from(table)
      .select('id, amount_total, fee_total, refunded_amount, review_reason')
      .eq('stripe_payment_intent_id', paymentIntentId)
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (data) {
      return {
        table,
        id: data.id,
        amountTotal: data.amount_total ?? 0,
        feeTotal: data.fee_total ?? 0,
        refundedAmount: data.refunded_amount ?? 0,
        reviewReason: data.review_reason,
      };
    }
  }
  return null;
}

async function flagSaleForReview(admin: AdminClient, sale: SaleRef, reason: string): Promise<void> {
  // A redelivered event must not append the same reason twice.
  if (sale.reviewReason?.includes(reason)) return;
  // Keep an earlier, unresolved reason visible rather than overwrite it.
  const reviewReason = sale.reviewReason ? `${sale.reviewReason}\n${reason}` : reason;
  const { error } = await admin
    .from(sale.table)
    .update({ review_reason: reviewReason })
    .eq('id', sale.id);
  if (error) throw error;
}

/* A refund made outside the app (Stripe dashboard, or a refund this app made
 * whose DB write was lost) must still show on the sale. In-app refunds
 * reserve refunded_amount before calling Stripe, so Stripe's total only ever
 * catches up with it; anything above it came from elsewhere. Only ever
 * raises refunded_amount, clamped to the refundable cap (amount − fee) the DB
 * enforces, and flags the sale: an outside refund did not reverse the
 * organizer's transfer the way the app does (H11). */
async function handleChargeRefunded(charge: Stripe.Charge): Promise<void> {
  const paymentIntentId = paymentIntentIdOf(charge.payment_intent);
  if (!paymentIntentId) return;

  const admin = createAdminClient();
  const sale = await findSaleByPaymentIntent(admin, paymentIntentId);
  if (!sale) {
    const owner = await findSaleByAdditionalCharge(admin, paymentIntentId);
    if (owner) {
      await syncAdditionalChargeRefund(admin, owner, paymentIntentId, charge);
      return;
    }
    console.warn(
      '[stripe-webhook] charge.refunded for a payment with no order/booking or additional charge',
      charge.id,
      paymentIntentId,
    );
    return;
  }

  const stripeRefunded = Math.round(charge.amount_refunded) / 100;
  const cap = Math.round((sale.amountTotal - sale.feeTotal) * 100) / 100;
  const target = Math.min(stripeRefunded, cap);
  if (target <= sale.refundedAmount) return;

  const { data: synced, error } = await admin
    .from(sale.table)
    .update({ refunded_amount: target })
    .eq('id', sale.id)
    .eq('refunded_amount', sale.refundedAmount)
    .select('id')
    .maybeSingle();
  if (error) throw error;
  // A lost compare-and-swap means an in-app refund moved it meanwhile; throw
  // so Stripe redelivers and this re-reads the new value.
  if (!synced) {
    throw new Error(`refunded_amount for ${sale.table} ${sale.id} moved while syncing a refund`);
  }

  console.error(
    '[stripe-webhook] refund made outside the app synced to sale',
    sale.table,
    sale.id,
    stripeRefunded,
  );
  await flagSaleForReview(
    admin,
    sale,
    stripeRefunded > cap
      ? `Stripe shows $${stripeRefunded.toFixed(2)} refunded on charge ${charge.id} — more than the $${cap.toFixed(2)} refundable (platform fee was refunded outside the app). Check the organizer transfer.`
      : `A refund was made outside the app on charge ${charge.id} (now $${stripeRefunded.toFixed(2)} refunded). Check the organizer transfer was reversed.`,
  );
}

/* The order or vendor booking an additional charge ("charge more") belongs
 * to — its PaymentIntent id is the `id` of an element of additional_charges. */
async function findSaleByAdditionalCharge(
  admin: AdminClient,
  paymentIntentId: string,
): Promise<SaleRef | null> {
  for (const table of ['orders', 'vendor_bookings'] as const) {
    const { data, error } = await admin
      .from(table)
      .select('id, amount_total, fee_total, refunded_amount, review_reason')
      .contains('additional_charges', JSON.stringify([{ id: paymentIntentId }]))
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (data) {
      return {
        table,
        id: data.id,
        amountTotal: data.amount_total ?? 0,
        feeTotal: data.fee_total ?? 0,
        refundedAmount: data.refunded_amount ?? 0,
        reviewReason: data.review_reason,
      };
    }
  }
  return null;
}

/* Same contract as the original-payment sync above, for one additional
 * charge: refundAdditionalCharge reserves the charge's `refunded` before
 * calling Stripe, so Stripe's figure only ever catches up with it. Anything
 * above it was refunded outside the app — raise `refunded` to match (never
 * lower it, never past the charge amount) and flag the sale, since an outside
 * refund did not reverse the organizer's transfer. */
async function syncAdditionalChargeRefund(
  admin: AdminClient,
  sale: SaleRef,
  paymentIntentId: string,
  charge: Stripe.Charge,
): Promise<void> {
  const stripeRefunded = Math.round(charge.amount_refunded) / 100;

  const synced = await updateAdditionalChargesLedger(admin, sale.table, sale.id, ({ charges }) => {
    const record = charges.find((c) => c.id === paymentIntentId);
    if (!record) return { write: false, result: false };
    const target = roundCents(Math.min(stripeRefunded, chargeAmount(record)));
    if (target <= additionalChargeRefunded(record)) return { write: false, result: false };
    record.refunded = target;
    return { write: true, charges, result: true };
  });
  if (!synced) return;

  console.error(
    '[stripe-webhook] refund made outside the app synced to additional charge',
    sale.table,
    sale.id,
    paymentIntentId,
    stripeRefunded,
  );
  await flagSaleForReview(
    admin,
    sale,
    `A refund was made outside the app on additional charge ${paymentIntentId} (charge ${charge.id}, now $${stripeRefunded.toFixed(2)} refunded). Check the organizer transfer was reversed.`,
  );
}

async function handleDisputeCreated(dispute: Stripe.Dispute): Promise<void> {
  const paymentIntentId = paymentIntentIdOf(dispute.payment_intent);
  console.error(
    '[stripe-webhook] dispute opened',
    dispute.id,
    dispute.reason,
    dispute.amount,
    paymentIntentId,
  );
  if (!paymentIntentId) return;

  const admin = createAdminClient();
  const sale = await findSaleByPaymentIntent(admin, paymentIntentId);
  if (!sale) {
    console.warn('[stripe-webhook] dispute for a payment with no order/booking', dispute.id);
    return;
  }
  await flagSaleForReview(
    admin,
    sale,
    `Dispute ${dispute.id} opened (${dispute.reason}) for $${(dispute.amount / 100).toFixed(2)} — respond in Stripe before the deadline.`,
  );
}

/* A delayed payment method (e.g. bank debit) failed after checkout. The rider
 * order is closed as failed; a vendor booking simply stays payable. */
async function handleCheckoutSessionAsyncPaymentFailed(
  session: Stripe.Checkout.Session,
): Promise<void> {
  if (session.metadata?.bookingId) {
    console.warn(
      '[stripe-webhook] delayed vendor payment failed — booking stays payable',
      session.metadata.bookingId,
      session.id,
    );
    return;
  }
  const orderId = session.metadata?.orderId;
  if (!orderId) return;
  const admin = createAdminClient();
  await markOrderPaymentFailed(admin, orderId, session.id);
}
