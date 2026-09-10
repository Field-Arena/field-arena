import { z } from 'zod';

/**
 * Email address for a login identity — trimmed and lower-cased before the format
 * check, so the same address always resolves to one account no matter how it was
 * typed. "Haris@YopMail.com" and "haris@yopmail.com" are the same person.
 *
 * Use this for anything that has to match an existing account: sign-in, sign-up,
 * password reset, OTP verification, and staff / organizer invites (the invited
 * address becomes their login).
 */
export function emailSchema(invalidMessage = 'Enter a valid email address') {
  return z.string().trim().toLowerCase().pipe(z.email(invalidMessage));
}

/** Same as {@link emailSchema} but with a distinct message for a blank field. */
export function requiredEmailSchema(
  invalidMessage = 'Enter a valid email address',
  requiredMessage = 'Email is required',
) {
  return z.string().trim().min(1, requiredMessage).toLowerCase().pipe(z.email(invalidMessage));
}
