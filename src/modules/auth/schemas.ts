import { z } from 'zod';

export const loginSchema = z.object({
  email: z.email('Enter a valid email address').min(1, 'Email is required'),

  password: z.string().min(1, 'Password is required'),

  remember: z.boolean().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const requestPasswordResetSchema = z.object({
  email: z.email('Enter a valid email address').min(1, 'Email is required'),
});

export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>;

export const verifySignInCodeSchema = z.object({
  email: z.email('Enter a valid email address'),
  token: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Enter all six digits from the email'),
  remember: z.boolean().optional(),
});

export type VerifySignInCodeInput = z.infer<typeof verifySignInCodeSchema>;

export const signUpSchema = z.object({
  email: z
    .email('Enter a valid email address so we can send your code')
    .min(1, 'Email is required'),
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

export const verifyEmailSchema = z.object({
  email: z.email('Enter a valid email address'),
  token: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Enter all six digits from the email'),
});

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
