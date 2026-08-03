import 'server-only';
import Stripe from 'stripe';
import { env } from './env';

/**
 * Server-only Stripe client — refunds and off-session additional charges on
 * real orders and vendor bookings. Ported from the legacy api/_lib/stripe.js,
 * which was a single `new Stripe(process.env.STRIPE_SECRET_KEY)` with no
 * pinned API version; kept the same here rather than pinning one this port
 * never validated against.
 *
 * Lazily constructed so importing this module never throws for code paths
 * that don't actually call Stripe (e.g. type-only imports).
 */
let client: Stripe | null = null;

export function getStripeClient(): Stripe {
  client ??= new Stripe(env.stripeSecretKey);
  return client;
}

/**
 * True only for a real `sk_live_` key — never inferred from NODE_ENV, since a
 * deploy can run in test mode on purpose. Reads the raw env var rather than
 * `env.stripeSecretKey` so a page that only wants this cosmetic live/test
 * label doesn't crash outright when Stripe isn't configured at all.
 */
export function isStripeLive(): boolean {
  return (process.env.STRIPE_SECRET_KEY ?? '').startsWith('sk_live_');
}
