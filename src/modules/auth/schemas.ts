import { z } from 'zod';

export const loginSchema = z.object({
  email: z.email('Enter a valid email address').min(1, 'Email is required'),
  /**
   * Only a presence check. A minimum length here would be a lie about an
   * existing account — the password was set under whatever policy applied then,
   * and rejecting it client-side would lock the user out of their own account
   * with a validation error rather than letting the auth server answer.
   * Strength rules belong on the sign-up and reset forms.
   */
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const requestPasswordResetSchema = z.object({
  email: z.email('Enter a valid email address').min(1, 'Email is required'),
});

export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>;
