import { z } from 'zod';

/**
 * Vendor self-service inputs: signing up with no prior invite, applying to a
 * show, signing the booth agreement, the booking's document checklist, and
 * booth-fee checkout.
 */

/**
 * Self-service vendor account creation — the "apply first, account second"
 * entry point from a show's public vendor-apply page (see
 * data/mutations.ts's signUpVendor). Same shape as riders/schemas.ts's
 * riderSignUpSchema, kept as its own copy rather than imported: a module must
 * not reach into another module's internals (.claude/rules/folder-structure.md).
 */
export const vendorSignUpSchema = z.object({
  name: z.string().trim().min(1, 'Your name is required').max(200),
  email: z.email('Enter a valid email address').min(1, 'Email is required'),
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

/** The 6-digit code Supabase emails after signUpVendor, when email confirmation is on. */
export const vendorVerifySchema = z.object({
  email: z.email('Enter a valid email address'),
  token: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Enter all six digits from the email'),
});

export type VendorVerifyInput = z.infer<typeof vendorVerifySchema>;

export const vendorResendCodeSchema = z.object({ email: z.email('Enter a valid email address') });

export type VendorResendCodeInput = z.infer<typeof vendorResendCodeSchema>;

const cartLine = z.object({
  vendorItemId: z.uuid(),
  qty: z.coerce.number().int().min(1).max(999),
});

export const applyToShowSchema = z.object({
  showId: z.uuid(),
  /** Business/farm name as it should appear in the programme — see vendor_bookings.name's own doc comment for why this is separate from the signed-in person's own name. */
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
  // A booking with nothing in it is a real footgun, not a rejected-by-design
  // legacy shape (handleVendorApply, api/shows/[id]/[resource].js, would
  // have inserted the same empty vendor_booking_items set) — one that just
  // happened live: a form submitted with every quantity still at its default
  // 0 creates an approvable, signable, $0-forever booking with nothing to
  // pay. Both apply entry points (this schema is shared by
  // VendorApplyDialog's already-signed-in flow and
  // VendorApplyEntryForm's no-account flow) also disable their own submit
  // button on an empty cart — this is the real enforcement, not just UX.
  items: z.array(cartLine).min(1, 'Select at least one booth space').max(50),
});

export type ApplyToShowInput = z.input<typeof applyToShowSchema>;

export const signVendorAgreementSchema = z.object({
  bookingId: z.uuid(),
  fullName: z.string().trim().min(1, 'Your typed full legal name is required').max(200),
});

export type SignVendorAgreementInput = z.input<typeof signVendorAgreementSchema>;

/** Step one of the two-step upload (see shows/schemas.ts's createDocumentUploadUrlSchema for the pattern this mirrors). */
export const createVendorDocumentUploadUrlSchema = z.object({
  bookingId: z.uuid(),
  requirementId: z.string().trim().min(1).max(200),
  name: z.string().trim().min(1, 'A file name is required').max(300),
});

export type CreateVendorDocumentUploadUrlInput = z.input<
  typeof createVendorDocumentUploadUrlSchema
>;

/** Step two: record the object the browser just uploaded. */
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

/** Starts booth-fee checkout for one approved booking — no cart to assemble, unlike rider checkout: the items are already the booking's own vendor_booking_items rows. */
export const createVendorCheckoutSessionSchema = z.object({
  bookingId: z.uuid(),
});

export type CreateVendorCheckoutSessionInput = z.input<typeof createVendorCheckoutSessionSchema>;

/** The return-from-Stripe confirm step — matches legacy's vendor-checkout-confirm and riders' confirmCheckoutSessionSchema. */
export const confirmVendorCheckoutSessionSchema = z.object({
  bookingId: z.uuid(),
  sessionId: z.string().trim().min(1, 'A valid Checkout Session id is required'),
});

export type ConfirmVendorCheckoutSessionInput = z.input<typeof confirmVendorCheckoutSessionSchema>;

export type RemoveVendorDocumentInput = z.input<typeof removeVendorDocumentSchema>;

/**
 * Staff review of a pending application — the organizer-side half of the
 * pending → approved/rejected → paid flow createVendorCheckoutSession already
 * gates on (see data/mutations.ts's assertCanManageVendors). showId is
 * required alongside bookingId so the permission check has a show to check
 * canManageVendors against, same shape as sales/schemas.ts's refundSaleSchema.
 */
export const reviewVendorBookingSchema = z.object({
  bookingId: z.uuid(),
  showId: z.uuid(),
});

export type ReviewVendorBookingInput = z.input<typeof reviewVendorBookingSchema>;
