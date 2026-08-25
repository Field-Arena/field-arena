import { NextResponse, type NextRequest } from 'next/server';
import type Stripe from 'stripe';
import { getStripeClient } from '@/shared/lib/stripe';
import { env } from '@/shared/lib/env';
import { createAdminClient } from '@/shared/lib/supabase/admin';
import { finalizeOrder, saveOffSessionCard } from '@/modules/riders/data/checkout';
import {
  finalizeVendorBookingPayment,
  priceVendorBooking,
  saveVendorOffSessionCard,
} from '@/modules/vendors/data/checkout';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  const rawBody = await request.text();

  const stripe = getStripeClient();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, env.stripeWebhookSecret);
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : 'Invalid signature';
    console.error('[stripe-webhook] signature verification failed', message);
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${message}` },
      { status: 400 },
    );
  }

  switch (event.type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded':
      await handleCheckoutSessionPaid(event.data.object);
      break;
    default:
      break;
  }

  return NextResponse.json({ received: true });
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
  if (orderError || !order) {
    console.error('[stripe-webhook] order not found for session', session.id, orderId, orderError);
    return;
  }

  if (order.status === 'paid') return;

  if (session.amount_total !== Math.round(order.amount_total * 100)) {
    console.error(
      '[stripe-webhook] amount mismatch for order',
      orderId,
      session.amount_total,
      order.amount_total,
    );
    return;
  }

  const { data: rider, error: riderError } = await admin
    .from('riders')
    .select('*')
    .eq('id', order.rider_id)
    .maybeSingle();
  if (riderError || !rider) {
    console.error('[stripe-webhook] rider not found for order', orderId, riderError);
    return;
  }

  if (session.payment_intent) {
    const stripe = getStripeClient();
    const paymentIntentId =
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent.id;
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId).catch(() => null);
    if (paymentIntent) await saveOffSessionCard(admin, order.id, paymentIntent);
  }

  try {
    await finalizeOrder(admin, order, rider);
  } catch (cause) {
    console.error('[stripe-webhook] finalizeOrder failed for order', orderId, cause);
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
  if (bookingError || !booking) {
    console.error(
      '[stripe-webhook] vendor booking not found for session',
      session.id,
      bookingId,
      bookingError,
    );
    return;
  }

  if (booking.status === 'paid') return;

  const priced = await priceVendorBooking(admin, booking);

  if (session.amount_total !== Math.round(priced.total * 100)) {
    console.error(
      '[stripe-webhook] amount mismatch for vendor booking',
      bookingId,
      session.amount_total,
      priced.total,
    );
    return;
  }

  let paymentIntentId: string | null = null;
  if (session.payment_intent) {
    const stripe = getStripeClient();
    paymentIntentId =
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent.id;
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
  }
}
