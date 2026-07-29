/** Copy for the auth screens, verbatim from the sign-up design. */

export const AUTH_ASIDE_POINTS = [
  'Enter horse and rider details once — reused all event long',
  'Live ring status, orders of go, scratches, and results',
  'Free to create — nothing owed until you run a show',
] as const;

export const AUTH_ASIDE_QUOTE =
  '“The exhibitor should not have to wait hours for information.”';

/** How many digits the emailed confirmation code has. */
export const EMAIL_CODE_LENGTH = 6;

/**
 * Seconds before "Send a new code" re-enables.
 *
 * Matches the design's default. It is also a courtesy to Supabase's own rate
 * limit — hammering resend returns an error rather than a second email, so the
 * countdown prevents a user generating that error themselves.
 */
export const RESEND_COOLDOWN_SECONDS = 30;
