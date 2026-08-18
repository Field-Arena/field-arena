/**
 * Whether a half-typed field is complete enough to name in copy.
 *
 * Not validation — Zod owns that, and the auth server owns the final word. This
 * only decides whether the reset panel can say "we'll send a link to you@barn.com"
 * or has to fall back to "your account email", so being loose is the point: it
 * runs on every keystroke and must not accuse anyone mid-word.
 */
export function isEmailAddress(value: string | undefined): value is string {
  return !!value && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);
}
