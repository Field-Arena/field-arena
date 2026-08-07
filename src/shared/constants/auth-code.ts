/** How many digits an emailed confirmation code has — shared by every module's own OTP step (auth, riders, vendors). */
export const EMAIL_CODE_LENGTH = 6;

/**
 * Seconds before "Send a new code" re-enables.
 *
 * Matches the design's default. It is also a courtesy to Supabase's own rate
 * limit — hammering resend returns an error rather than a second email, so the
 * countdown prevents a user generating that error themselves.
 */
export const RESEND_COOLDOWN_SECONDS = 30;
