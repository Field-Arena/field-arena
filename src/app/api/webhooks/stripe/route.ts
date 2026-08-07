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

/**
 * Stripe's server-to-server confirmation that a Checkout Session actually
 * paid — the second of the two ways an order gets fulfilled, alongside
 * riders/data/mutations.ts's confirmCheckoutSession (the in-page
 * return-from-Stripe path). Both call the exact same finalizeOrder, so
 * whichever one reaches "paid" first wins and the other's call is a no-op
 * (finalizeOrder's atomic claim — see that function's own comment) rather
 * than a double-fulfillment. This webhook is the one that's guaranteed to
 * run even if the rider's browser never makes it back (closed tab, network
 * drop, an ad blocker eating the redirect).
 *
 * A route handler, not a Server Action, because Stripe POSTs here directly —
 * nothing about this request carries a Field & Arena session, and the only
 * trust boundary is the signature Stripe attaches to the raw body.
 *
 * Dispatches on `event.type` in a switch rather than one giant handler, so a
 * genuinely new event type — a refund webhook, whatever comes next — is one
 * more `case`, not a restructure. Vendor booth-fee payments (added
 * alongside rider checkout) reuse the *same* two cases rather than adding
 * their own: a vendor booking's Checkout Session is created in the same
 * `mode: 'payment'`, so Stripe fires identical event types for either kind
 * of sale. See handleCheckoutSessionPaid's own comment for how the two are
 * told apart.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  // The raw, unparsed body is required — constructEvent verifies the
  // signature against these exact bytes, and Next.js would otherwise hand
  // back a body already re-serialized by its own JSON parsing, which no
  // longer matches the signature Stripe computed.
  const rawBody = await request.text();

  const stripe = getStripeClient();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, env.stripeWebhookSecret);
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : 'Invalid signature';
    console.error('[stripe-webhook] signature verification failed', message);
    return NextResponse.json({ error: `Webhook signature verification failed: ${message}` }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded':
      await handleCheckoutSessionPaid(event.data.object);
      break;
    default:
      // Every other event type Stripe sends (and it sends far more than this
      // endpoint currently acts on) is acknowledged with 200 and otherwise
      // ignored, so Stripe does not retry a webhook there is nothing to do
      // for.
      break;
  }

  return NextResponse.json({ received: true });
}

/**
 * Fulfills one paid Checkout Session. Every failure path below returns
 * quietly (logged, not thrown) rather than a non-2xx response: Stripe
 * retries a failing webhook on a backoff schedule, and a response body a
 * human never sees is not where a real operational problem should surface —
 * these are logged instead. finalizeOrder's/finalizeVendorBookingPayment's
 * own internal checks (the amount match, the atomic claim) are the real
 * correctness guarantees; this function's job is just telling the two kinds
 * of Checkout Session apart and handing off.
 *
 * A rider order and a vendor booth-fee booking both create their Checkout
 * Session in `mode: 'payment'`, so Stripe fires the exact same event types
 * for either one (checkout.session.completed /
 * checkout.session.async_payment_succeeded) — there is no separate event
 * type to add a `case` for. The two are told apart by which metadata key
 * their own createCheckoutSession/createVendorCheckoutSession set:
 * `orderId` for a rider, `bookingId` for a vendor.
 */
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
  // Already fulfilled — most likely the in-page confirmCheckoutSession path
  // won the race. Nothing left to do.
  if (order.status === 'paid') return;

  // Belt and suspenders, same check confirmCheckoutSession makes: the
  // session's metadata.orderId already ties it to this exact order, but the
  // amount is re-verified against what was actually priced and stored,
  // never trusted from the event alone.
  if (session.amount_total !== Math.round(order.amount_total * 100)) {
    console.error('[stripe-webhook] amount mismatch for order', orderId, session.amount_total, order.amount_total);
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
      typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent.id;
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId).catch(() => null);
    if (paymentIntent) await saveOffSessionCard(admin, order.id, paymentIntent);
  }

  try {
    await finalizeOrder(admin, order, rider);
  } catch (cause) {
    console.error('[stripe-webhook] finalizeOrder failed for order', orderId, cause);
  }
}

/** Vendor equivalent of handleRiderOrderCheckoutPaid — same shape, mirrors modules/vendors/data/mutations.ts's confirmVendorCheckoutSession's own verification. */
async function handleVendorBookingCheckoutPaid(session: Stripe.Checkout.Session): Promise<void> {
  const bookingId = session.metadata?.bookingId;
  if (!bookingId) return; // narrowed by the caller already; keeps this self-contained
  if (session.payment_status !== 'paid') return;

  const admin = createAdminClient();

  const { data: booking, error: bookingError } = await admin
    .from('vendor_bookings')
    .select('*')
    .eq('id', bookingId)
    .maybeSingle();
  if (bookingError || !booking) {
    console.error('[stripe-webhook] vendor booking not found for session', session.id, bookingId, bookingError);
    return;
  }
  // Already fulfilled — most likely the in-page confirmVendorCheckoutSession
  // path won the race. Nothing left to do.
  if (booking.status === 'paid') return;

  const priced = await priceVendorBooking(admin, booking);
  // Belt and suspenders, same check confirmVendorCheckoutSession makes: the
  // session's metadata.bookingId already ties it to this exact booking, but
  // the amount is re-verified against what was actually priced, never
  // trusted from the event alone.
  if (session.amount_total !== Math.round(priced.total * 100)) {
    console.error('[stripe-webhook] amount mismatch for vendor booking', bookingId, session.amount_total, priced.total);
    return;
  }

  let paymentIntentId: string | null = null;
  if (session.payment_intent) {
    const stripe = getStripeClient();
    paymentIntentId =
      typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent.id;
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId).catch(() => null);
    if (paymentIntent) await saveVendorOffSessionCard(admin, booking.id, paymentIntent);
  }

  try {
    await finalizeVendorBookingPayment(admin, booking, priced, paymentIntentId);
  } catch (cause) {
    console.error('[stripe-webhook] finalizeVendorBookingPayment failed for booking', bookingId, cause);
  }
}
