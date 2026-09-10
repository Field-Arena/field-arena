import { z } from 'zod';
import { emailSchema, requiredEmailSchema } from '@/shared/schemas/email';

export const vendorSignUpSchema = z.object({
  name: z.string().trim().min(1, 'Your name is required').max(200),
  email: requiredEmailSchema(),
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

export type VendorSignUpInput = z.infer<typeof vendorSignUpSchema>;

export const vendorVerifySchema = z.object({
  email: emailSchema(),
  token: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Enter all six digits from the email'),
});

export type VendorVerifyInput = z.infer<typeof vendorVerifySchema>;

export const vendorResendCodeSchema = z.object({ email: emailSchema() });

export type VendorResendCodeInput = z.infer<typeof vendorResendCodeSchema>;

const cartLine = z.object({
  vendorItemId: z.uuid(),
  qty: z.coerce.number().int().min(1).max(999),
});

export const applyToShowSchema = z.object({
  showId: z.uuid(),

  businessName: z.string().trim().min(1, 'A business or farm name is required').max(300),
  contactName: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
  phone: z
    .string()
    .trim()
    .max(40)
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
  website: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
  productsOffered: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
  specialRequests: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((v) => (v === '' ? undefined : v)),

  items: z.array(cartLine).min(1, 'Select at least one booth space').max(50),
});

export type ApplyToShowInput = z.input<typeof applyToShowSchema>;

export const applyToShowPublicSchema = z.object({
  showId: z.uuid(),
  businessName: z.string().trim().min(1, 'A business or farm name is required').max(300),
  contactName: z.string().trim().min(1, 'A contact name is required').max(200),
  email: emailSchema(),
  phone: z
    .string()
    .trim()
    .max(40)
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
  website: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
  productsOffered: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
  specialRequests: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((v) => (v === '' ? undefined : v)),

  items: z.array(cartLine).min(1, 'Select at least one booth space').max(50),
});

export type ApplyToShowPublicInput = z.input<typeof applyToShowPublicSchema>;

export const signVendorAgreementSchema = z.object({
  bookingId: z.uuid(),
  fullName: z.string().trim().min(1, 'Your typed full legal name is required').max(200),
});

export type SignVendorAgreementInput = z.input<typeof signVendorAgreementSchema>;

export const createVendorDocumentUploadUrlSchema = z.object({
  bookingId: z.uuid(),
  requirementId: z.string().trim().min(1).max(200),
  name: z.string().trim().min(1, 'A file name is required').max(300),
});

export type CreateVendorDocumentUploadUrlInput = z.input<
  typeof createVendorDocumentUploadUrlSchema
>;

export const registerVendorDocumentSchema = z.object({
  bookingId: z.uuid(),
  requirementId: z.string().trim().min(1).max(200),
  label: z.string().trim().min(1).max(200),
  path: z.string().trim().min(1).max(400),
});

export type RegisterVendorDocumentInput = z.input<typeof registerVendorDocumentSchema>;

export const removeVendorDocumentSchema = z.object({
  bookingId: z.uuid(),
  requirementId: z.string().trim().min(1).max(200),
});

export const createVendorCheckoutSessionSchema = z.object({
  bookingId: z.uuid(),
});

export type CreateVendorCheckoutSessionInput = z.input<typeof createVendorCheckoutSessionSchema>;

export const confirmVendorCheckoutSessionSchema = z.object({
  bookingId: z.uuid(),
  sessionId: z.string().trim().min(1, 'A valid Checkout Session id is required'),
});

export type ConfirmVendorCheckoutSessionInput = z.input<typeof confirmVendorCheckoutSessionSchema>;

export type RemoveVendorDocumentInput = z.input<typeof removeVendorDocumentSchema>;

export const reviewVendorBookingSchema = z.object({
  bookingId: z.uuid(),
  showId: z.uuid(),
});

export type ReviewVendorBookingInput = z.input<typeof reviewVendorBookingSchema>;
