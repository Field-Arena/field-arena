import { z } from 'zod';
import { RIDER_CATEGORIES } from '@/modules/riders/constants';
import { emailSchema, requiredEmailSchema } from '@/shared/schemas/email';

export const riderSignUpSchema = z.object({
  email: requiredEmailSchema('Enter a valid email address so we can send your code'),
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

export const riderVerifySchema = z.object({
  email: emailSchema(),
  token: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Enter all six digits from the email'),
});

export type RiderVerifyInput = z.infer<typeof riderVerifySchema>;

export const riderResendCodeSchema = z.object({
  email: emailSchema(),
});

export type RiderResendCodeInput = z.infer<typeof riderResendCodeSchema>;

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

export const horseCreateSchema = z.object({
  name: z.string().trim().min(1, "The horse's registered name is required"),
});

export type HorseCreateInput = z.infer<typeof horseCreateSchema>;

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

export const waiverSignSchema = z.object({
  showId: z.uuid(),
  fullName: z.string().trim().min(1, 'Your typed full legal name is required'),
  signatureDate: z.string().trim().min(1, 'A signature date is required'),
});

export type WaiverSignInput = z.infer<typeof waiverSignSchema>;

export const checkoutCartLineSchema = z.object({
  classId: z.uuid(),
  horseId: z.uuid(),
  qualTypeIds: z.array(z.uuid()).optional(),
  // The scoring_catalog title of the test this rider chose, for a Test of
  // Choice class (classes.test_options non-empty). Absent for an ordinary
  // class — priceCart/finalizeOrder only look for this when the class it
  // belongs to actually has test_options set.
  testChoice: z.string().trim().min(1).optional(),
});

export type CheckoutCartLine = z.infer<typeof checkoutCartLineSchema>;

export const checkoutAddOnLineSchema = z.object({
  addOnId: z.uuid(),
  qty: z.number().int().positive(),
});

export type CheckoutAddOnLine = z.infer<typeof checkoutAddOnLineSchema>;

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

export const confirmCheckoutSessionSchema = z.object({
  orderId: z.uuid(),
  sessionId: z.string().trim().min(1, 'A valid Checkout Session id is required'),
});

export type ConfirmCheckoutSessionInput = z.infer<typeof confirmCheckoutSessionSchema>;

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
