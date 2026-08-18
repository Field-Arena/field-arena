/** Copy for the auth screens, verbatim from the sign-up design. */

export const AUTH_ASIDE_POINTS = [
  'Enter horse and rider details once — reused all event long',
  'Live ring status, orders of go, scratches, and results',
  'Free to create — nothing owed until you run a show',
] as const;

export const AUTH_ASIDE_QUOTE =
  '“The exhibitor should not have to wait hours for information.”';

/**
 * Shown when a Supabase auth call that sends an email dies at the socket
 * ("fetch failed") rather than returning a Supabase error object — see
 * withMailTransport in data/mutations.ts.
 */
export const MAIL_UNREACHABLE_MESSAGE =
  'We could not reach the email service just now. Wait a moment and try again.';

/** An authenticated account with no staff/rider profile row — see provisionedDestination in data/mutations.ts. */
export const NOT_PROVISIONED_MESSAGE =
  'This account is not set up on Field & Arena yet. Ask your organizer or a platform admin to invite you.';
