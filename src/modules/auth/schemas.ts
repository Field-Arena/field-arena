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
  /**
   * "Keep me signed in on this device". Optional so that any caller which never
   * renders the checkbox still parses, and it then falls back to the design's
   * default — the box starts ticked.
   */
  remember: z.boolean().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const requestPasswordResetSchema = z.object({
  email: z.email('Enter a valid email address').min(1, 'Email is required'),
});

export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>;

/** The one-time sign-in code offered as an alternative to resetting a password. */
export const verifySignInCodeSchema = z.object({
  email: z.email('Enter a valid email address'),
  token: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Enter all six digits from the email'),
  remember: z.boolean().optional(),
});

export type VerifySignInCodeInput = z.infer<typeof verifySignInCodeSchema>;

/**
 * Self-service sign-up.
 *
 * Unlike loginSchema, strength rules DO belong here: this is where the password
 * is chosen, so rejecting a weak one costs the user a retype rather than locking
 * them out of an account they already own. The two rules mirror the design's
 * strength meter — see passwordStrength() in shared/lib/password-strength.ts,
 * which scores the same three signals the meter draws.
 */
export const signUpSchema = z.object({
  email: z.email('Enter a valid email address so we can send your code').min(1, 'Email is required'),
  password: z
    .string()
    .min(8, 'Passwords need at least 8 characters')
    .refine((value) => /[a-z]/.test(value) && /[A-Z]/.test(value), {
      message: 'Add an uppercase letter to strengthen this password',
    })
    .refine((value) => /[0-9]/.test(value) || /[^A-Za-z0-9]/.test(value), {
      message: 'Add a number or symbol to strengthen this password',
    }),
});

export type SignUpInput = z.infer<typeof signUpSchema>;

/**
 * Set-a-password, reached right after an invite link is verified.
 *
 * `password` reuses signUpSchema's exact rule rather than duplicating it —
 * one strength policy for the one thing "choosing a password" ever means in
 * this app, whether that's self-service sign-up or finishing an invite.
 */
export const setPasswordSchema = z
  .object({
    password: signUpSchema.shape.password,
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type SetPasswordInput = z.infer<typeof setPasswordSchema>;

/** The 6-digit code emailed by Supabase after sign-up. */
export const verifyEmailSchema = z.object({
  email: z.email('Enter a valid email address'),
  token: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Enter all six digits from the email'),
});

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
