import { z } from 'zod';

/**
 * Vendor self-service inputs: applying to a show (anonymously, or as an
 * already-signed-in Vendor), signing the booth agreement, the booking's
 * document checklist, and booth-fee checkout.
 */

const cartLine = z.object({
  vendorItemId: z.uuid(),
  qty: z.coerce.number().int().min(1).max(999),
});

/**
 * Applying to a show as an already-signed-in platform Vendor
 * (VendorApplyDialog's "Reserve Space" flow, data/mutations.ts's
 * applyToVendorShow) — contact email comes from the caller's own session, not
 * this input, so it isn't collected here.
 */
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
  // pay. VendorApplyDialog also disables its own submit button on an empty
  // cart — this is the real enforcement, not just UX.
  items: z.array(cartLine).min(1, 'Select at least one booth space').max(50),
});

export type ApplyToShowInput = z.input<typeof applyToShowSchema>;

/**
 * Applying to a show with no account at all — legacy's vendor-apply.html,
 * ported faithfully as a genuinely anonymous submission (see
 * supabase/migrations/20260810120000_vendor_public_apply.sql for the RLS half
 * of this). `contactName` and `email` are required here, unlike
 * applyToShowSchema above: with no session to fall back on for identity, this
 * is the only way to know who applied or to look the application up later.
 * Same required set as legacy's own client-side validation (business name,
 * contact name, email).
 */
export const applyToShowPublicSchema = z.object({
  showId: z.uuid(),
  businessName: z.string().trim().min(1, 'A business or farm name is required').max(300),
  contactName: z.string().trim().min(1, 'A contact name is required').max(200),
  email: z.email('Enter a valid email address'),
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
  // Same min(1) footgun guard as applyToShowSchema above — legacy's own
  // server-side validation didn't enforce this, but an approvable, signable,
  // $0-forever booking with nothing to pay is a real bug this port already
  // found and fixed once; not worth reintroducing for the public entry point.
  items: z.array(cartLine).min(1, 'Select at least one booth space').max(50),
});

export type ApplyToShowPublicInput = z.input<typeof applyToShowPublicSchema>;

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
