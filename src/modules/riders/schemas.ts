import { z } from 'zod';
import { RIDER_CATEGORIES } from '@/modules/riders/constants';

/**
 * Self-service rider account creation — the "buy first, account second" entry
 * point from a show's ticket page (see data/mutations.ts's signUpRider).
 *
 * Same password-strength rule as auth module's signUpSchema, kept as its own
 * copy rather than imported: a module must not reach into another module's
 * internals (.claude/rules/folder-structure.md), and "choosing a password" is
 * a small enough rule to keep in sync by inspection.
 */
export const riderSignUpSchema = z.object({
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

export type RiderSignUpInput = z.infer<typeof riderSignUpSchema>;

/** The 6-digit code Supabase emails after signUpRider. */
export const riderVerifySchema = z.object({
  email: z.email('Enter a valid email address'),
  token: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Enter all six digits from the email'),
});

export type RiderVerifyInput = z.infer<typeof riderVerifySchema>;

export const riderResendCodeSchema = z.object({
  email: z.email('Enter a valid email address'),
});

export type RiderResendCodeInput = z.infer<typeof riderResendCodeSchema>;

/**
 * Rider details — USEF/FEI credentials, category, date of birth, emergency
 * contact. Mirrors rider.html Step 3's realValidateDetails required set
 * (category, dob, emergency contact) plus the optional USEF/FEI/ranking
 * fields collected on the same step.
 *
 * Also doubles as the Profile tab's single-field edit payload (data/
 * mutations.ts's updateRiderProfile) — every field here is optional at the
 * schema level and the mutation only writes whichever keys are present. No
 * per-field `.min(1)`: legacy's handleMe PATCH (api/rider/[resource].js)
 * writes whatever string it's given, including '', so a rider can blank out
 * a previously-set phone/address/emergency-contact field — a `.min(1)` here
 * would silently make that impossible. `.refine` below still blocks a
 * no-key, genuinely-empty PATCH.
 */
export const riderProfileUpdateSchema = z
  .object({
    phone: z.string().trim().optional(),
    street: z.string().trim().optional(),
    city: z.string().trim().optional(),
    state: z.string().trim().optional(),
    zip: z.string().trim().optional(),
    usef: z.string().trim().optional(),
    fei: z.string().trim().optional(),
    category: z.enum(RIDER_CATEGORIES).optional(),
    dob: z.string().trim().optional(),
    ecFirstName: z.string().trim().optional(),
    ecLastName: z.string().trim().optional(),
    ecRel: z.string().trim().optional(),
    ecPhone: z.string().trim().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'No fields to update.',
  });

export type RiderProfileUpdateInput = z.infer<typeof riderProfileUpdateSchema>;

/**
 * The full rider-details step, all at once — Step 3's "Continue to horses /
 * class assignment" gate. A stricter superset of riderProfileUpdateSchema's
 * per-field rules: these are the fields legacy's realValidateDetails actually
 * required before letting a rider go further (USEF/FEI stay optional).
 */
export const riderDetailsFormSchema = z.object({
  usef: z.string().trim().optional(),
  fei: z.string().trim().optional(),
  category: z.enum(RIDER_CATEGORIES, { message: 'Choose a rider category' }),
  dob: z.string().trim().min(1, 'Date of birth is required'),
  ecFirstName: z.string().trim().min(1, "Emergency contact's first name is required"),
  ecLastName: z.string().trim().min(1, "Emergency contact's last name is required"),
  ecRel: z.string().trim().optional(),
  ecPhone: z.string().trim().min(1, "Emergency contact's phone is required"),
});

export type RiderDetailsFormInput = z.infer<typeof riderDetailsFormSchema>;

/**
 * Creating a horse — only `name` at creation time. Every other field is set
 * afterward via horseUpdateSchema. The immutable-name rule is enforced by a
 * DB trigger (assert_horse_name_immutable, 20260727120600_rider_domain.sql),
 * not repeated here — this schema simply never gives an UPDATE path a `name`
 * field to send in the first place (see horseUpdateSchema below).
 */
export const horseCreateSchema = z.object({
  name: z.string().trim().min(1, "The horse's registered name is required"),
});

export type HorseCreateInput = z.infer<typeof horseCreateSchema>;

/**
 * Updating a horse — deliberately has no `name` field at all, so a caller
 * cannot even attempt to change it through this action; the DB trigger is
 * the enforcement, this is just "there is no code path that tries."
 */
export const horseUpdateSchema = z.object({
  id: z.uuid(),
  stable: z.string().trim().optional(),
  trainer: z.string().trim().optional(),
  trainerPhone: z.string().trim().optional(),
  isStallion: z.boolean().optional(),
});

export type HorseUpdateInput = z.infer<typeof horseUpdateSchema>;

export const horseDeleteSchema = z.object({
  id: z.uuid(),
});

export type HorseDeleteInput = z.infer<typeof horseDeleteSchema>;

/**
 * The non-file fields of a horse-document upload — sent alongside the file
 * itself in a FormData payload (see data/mutations.ts's uploadHorseDocument),
 * so the file can't be validated by Zod directly.
 */
export const horseDocumentUploadFieldsSchema = z.object({
  horseId: z.uuid(),
  requirementId: z.string().trim().min(1),
  label: z.string().trim().min(1),
  expirationDate: z.string().trim().min(1).optional(),
});

export type HorseDocumentUploadFieldsInput = z.infer<typeof horseDocumentUploadFieldsSchema>;

export const horseDocumentDeleteSchema = z.object({
  horseId: z.uuid(),
  requirementId: z.string().trim().min(1),
});

export type HorseDocumentDeleteInput = z.infer<typeof horseDocumentDeleteSchema>;

/**
 * Signing a show's waiver of liability. One signature covers every horse and
 * entry a rider has for that show (see waiver_signatures' unique(rider_id,
 * show_id) — 20260727120600_rider_domain.sql), so there's nothing to key this
 * by beyond rider + show.
 */
export const waiverSignSchema = z.object({
  showId: z.uuid(),
  fullName: z.string().trim().min(1, 'Your typed full legal name is required'),
  signatureDate: z.string().trim().min(1, 'A signature date is required'),
});

export type WaiverSignInput = z.infer<typeof waiverSignSchema>;

// ---------------------------------------------------------------------------
// Checkout — cart pricing and Stripe Checkout Session creation. See
// data/checkout.ts for where these are actually enforced; this file only
// validates shape, never trusts amounts (there are none here — a client
// sends *what* it wants to buy, never what it costs).
// ---------------------------------------------------------------------------

/** One class a rider is entering, on one horse, with optional qualification add-ons. */
export const checkoutCartLineSchema = z.object({
  classId: z.uuid(),
  horseId: z.uuid(),
  qualTypeIds: z.array(z.uuid()).optional(),
});

export type CheckoutCartLine = z.infer<typeof checkoutCartLineSchema>;

export const checkoutAddOnLineSchema = z.object({
  addOnId: z.uuid(),
  qty: z.number().int().positive(),
});

export type CheckoutAddOnLine = z.infer<typeof checkoutAddOnLineSchema>;

/**
 * The full cart a rider wants priced and charged. `cart` and `addOns` may not
 * both be empty — same "your cart is empty" rule as legacy's priceCart.
 */
export const createCheckoutSessionSchema = z
  .object({
    showId: z.uuid(),
    cart: z.array(checkoutCartLineSchema),
    addOns: z.array(checkoutAddOnLineSchema),
  })
  .refine((value) => value.cart.length > 0 || value.addOns.length > 0, {
    message: 'Your cart is empty.',
  });

export type CreateCheckoutSessionInput = z.infer<typeof createCheckoutSessionSchema>;

/**
 * The return-from-Stripe confirm step — matches legacy's
 * checkout-session-confirm (?order=<id>&checkoutSession=<id> on the
 * redirect back).
 */
export const confirmCheckoutSessionSchema = z.object({
  orderId: z.uuid(),
  sessionId: z.string().trim().min(1, 'A valid Checkout Session id is required'),
});

export type ConfirmCheckoutSessionInput = z.infer<typeof confirmCheckoutSessionSchema>;

// ---------------------------------------------------------------------------
// Phase D — Purchases tab: stabling arrival/departure dates. Mirrors legacy's
// handleStabling (api/rider/[resource].js): only the two dates are rider-
// submitted; stall/tack/shavings/night counts are read-only, derived from
// what was purchased (see data/queries.ts's getStablingSummary).
// ---------------------------------------------------------------------------

export const stablingSaveSchema = z
  .object({
    orderId: z.uuid(),
    arrivalDate: z.string().trim().min(1, 'Arrival date is required'),
    departureDate: z.string().trim().min(1, 'Departure date is required'),
  })
  .refine((value) => value.departureDate >= value.arrivalDate, {
    message: "Departure date can't be before arrival date",
    path: ['departureDate'],
  });

export type StablingSaveInput = z.infer<typeof stablingSaveSchema>;
