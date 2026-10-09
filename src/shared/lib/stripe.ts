import 'server-only';
import Stripe from 'stripe';
import { env } from './env';

let client: Stripe | null = null;

export function getStripeClient(): Stripe {
  client ??= new Stripe(env.stripeSecretKey);
  return client;
}

export function isStripeLive(): boolean {
  return (process.env.STRIPE_SECRET_KEY ?? '').startsWith('sk_live_');
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/**
 * Checkout `payment_method_options` that save the payer's card for later
 * off-session "charge more" charges. Set per method (not as
 * `payment_intent_data.setup_future_usage`) so methods that can't be saved,
 * like Klarna, still appear at checkout. Apple Pay / Google Pay pay as `card`,
 * so they are saved too.
 */
export const SAVE_FOR_CHARGE_MORE = {
  card: { setup_future_usage: 'off_session' },
  link: { setup_future_usage: 'off_session' },
} satisfies Stripe.Checkout.SessionCreateParams.PaymentMethodOptions;

/** Payment method types we can reuse off-session for "charge more". */
const REUSABLE_PAYMENT_METHOD_TYPES = new Set(['card', 'link']);

/**
 * The payment method of a PaymentIntent, if it can be charged again
 * off-session. Klarna (and other buy-now-pay-later methods) return null, so
 * no card is stored and "charge more" reports there is no saved card.
 */
export async function reusablePaymentMethodId(
  paymentIntent: Stripe.PaymentIntent,
): Promise<string | null> {
  const pm = paymentIntent.payment_method;
  if (!pm) return null;
  const method = typeof pm === 'string' ? await getStripeClient().paymentMethods.retrieve(pm) : pm;
  return REUSABLE_PAYMENT_METHOD_TYPES.has(method.type) ? method.id : null;
}
