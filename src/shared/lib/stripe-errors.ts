import 'server-only';
import Stripe from 'stripe';

export function isStaleAccountError(error: unknown): boolean {
  return (
    error instanceof Stripe.errors.StripePermissionError ||
    error instanceof Stripe.errors.StripeInvalidRequestError
  );
}
