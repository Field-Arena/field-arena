export const PASSWORD_STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Strong'] as const;

export type PasswordStrength = 0 | 1 | 2 | 3;

export function passwordStrength(password: string): PasswordStrength {
  if (!password) return 0;

  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) score += 1;

  return Math.max(1, score) as PasswordStrength;
}

export function passwordStrengthLabel(password: string): string {
  return PASSWORD_STRENGTH_LABELS[passwordStrength(password)];
}
