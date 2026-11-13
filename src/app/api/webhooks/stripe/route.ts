import { NextResponse, type NextRequest } from 'next/server';
import type Stripe from 'stripe';
import { getStripeClient, isStripeLive } from '@/shared/lib/stripe';
import { env } from '@/shared/lib/env';
import { handleStripeEvent } from '@/modules/sales/data/stripe-webhook';

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

  /* A live-mode event reaching a test-key deployment (or the reverse) means
   * the endpoint and the secret key belong to different Stripe modes —
   * fulfilling it would mark real orders paid from test payments, or the other
   * way round. Acknowledge without acting so Stripe stops redelivering, and
   * log it loudly: the deployment's Stripe configuration needs fixing. */
  if (event.livemode !== isStripeLive()) {
    console.error('[stripe-webhook] livemode mismatch — event ignored', event.id, event.type, {
      eventLivemode: event.livemode,
      keyIsLive: isStripeLive(),
    });
    return NextResponse.json({ received: true, ignored: 'livemode mismatch' });
  }

  /* A thrown error means fulfilment did not finish (a DB hiccup, a partial
   * fulfilment). Answer non-2xx so Stripe retries the event — fulfilment is
   * idempotent per order/booking, so a retry completes what is missing rather
   * than duplicating it. Permanent conditions (unknown order, amount mismatch
   * already recorded) return normally and get a 200. */
  try {
    await handleStripeEvent(event);
  } catch (cause) {
    console.error('[stripe-webhook] handling failed for event', event.id, event.type, cause);
    return NextResponse.json({ error: 'Webhook handling failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
