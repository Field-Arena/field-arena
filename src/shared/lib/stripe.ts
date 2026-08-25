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
