import 'server-only';
import Stripe from 'stripe';

/**
 * Whether Stripe is telling us a stored `acct_...` is not ours.
 *
 * Two distinct errors mean the same thing in practice — the account belongs to
 * a different platform, or to no platform these keys can see:
 *
 *  - `StripePermissionError` — "Only Stripe Connect platforms can work with
 *    other accounts", which is also what a platform that has not finished
 *    Connect signup gets back.
 *  - `StripeInvalidRequestError` — "No such account".
 *
 * Both are 4xx: Stripe understood the request and refused it. Timeouts,
 * connection failures and 5xx are deliberately excluded, because treating a
 * transient outage as "this account is gone" would discard a real account id
 * and make an organizer redo onboarding they had already finished.
 */
export function isStaleAccountError(error: unknown): boolean {
  return (
    error instanceof Stripe.errors.StripePermissionError ||
    error instanceof Stripe.errors.StripeInvalidRequestError
  );
}
