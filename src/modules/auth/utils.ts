/**
 * Password strength, scored exactly as the sign-up design's meter draws it:
 * three independent signals, one filled bar each.
 *
 * Deliberately not a generic entropy estimate. The meter has three segments and
 * three labels, so a score the UI cannot render would be a lie — and the same
 * three rules are enforced by signUpSchema, which means the meter never shows
 * "Fair" for a password the server will then reject.
 */
export const PASSWORD_STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Strong'] as const;

export type PasswordStrength = 0 | 1 | 2 | 3;

export function passwordStrength(password: string): PasswordStrength {
  if (!password) return 0;

  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) score += 1;

  // A non-empty password always shows at least one bar: an empty meter beside
  // typed characters reads as "not registered" rather than "weak".
  return Math.max(1, score) as PasswordStrength;
}

export function passwordStrengthLabel(password: string): string {
  return PASSWORD_STRENGTH_LABELS[passwordStrength(password)];
}
