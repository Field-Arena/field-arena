import { z } from 'zod';
import {
  MEMBER_TYPES,
  MAX_RINGS,
  MAX_STABLES,
  MAX_STALLS_PER_STABLE,
} from '@/modules/organizations/constants';

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value === '' ? undefined : value));

export const completeOrgProfileSchema = z.object({
  /* Only a SuperAdmin may pass this: it targets an organization other than
   * the caller's own, which is how the console fills in a pending organizer's
   * profile on their behalf (legacy's onboarding preview loaded the real page
   * against a real org id for exactly this). Omitted, the caller's own org is
   * used and nothing changes for a real organizer completing their own setup. */
  orgId: z.uuid().optional(),
  name: z.string().trim().min(2, 'Organization name is required').max(160),
  email: z.email('Enter a valid email address'),
  website: optionalText(200),
  phone: optionalText(60),
  city: optionalText(120),
  region: optionalText(120),
  country: optionalText(120),
});

export type CompleteOrgProfileInput = z.input<typeof completeOrgProfileSchema>;

export const addOrgMemberSchema = z.object({
  orgId: z.uuid(),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.email('Enter a valid email address'),
  phone: optionalText(40),
  role: optionalText(60),
  membershipStatus: z.enum(['active', 'inactive']).default('active'),
  membershipExpires: optionalText(20),
});

export type AddOrgMemberInput = z.input<typeof addOrgMemberSchema>;

const ringRowSchema = z.object({
  name: z.string().trim().min(1, 'Ring name is required').max(80),
  size: z.enum(['standard', 'small']),
});

const venueStallSchema = z.object({
  id: z.string().trim().min(1).max(60),
  number: z.number().int().min(1),
  label: z.string().trim().min(1, 'Stall name is required').max(20),
  closed: z.boolean(),
});

const venueStableSchema = z.object({
  name: z.string().trim().min(1, 'Stable name is required').max(80),
  rowCount: z.coerce.number().int().min(1).max(50),
  stalls: z.array(venueStallSchema).max(MAX_STALLS_PER_STABLE),
});

export const venueFormSchema = z.object({
  name: z.string().trim().min(1, 'Venue name is required').max(160),
  address: optionalText(240),
  website: optionalText(200),
  phone: optionalText(60),
  contact: optionalText(120),
  rings: z.array(ringRowSchema).max(MAX_RINGS).default([]),
  stables: z.array(venueStableSchema).max(MAX_STABLES).default([]),
});

export type VenueFormInput = z.input<typeof venueFormSchema>;

export const venueDetailsSchema = venueFormSchema.omit({ rings: true, stables: true });
export type VenueDetailsInput = z.input<typeof venueDetailsSchema>;

export const createVenueSchema = venueFormSchema;
export type CreateVenueInput = z.input<typeof createVenueSchema>;

export const updateVenueSchema = venueFormSchema.extend({ id: z.uuid() });
export type UpdateVenueInput = z.input<typeof updateVenueSchema>;

export const deleteVenueSchema = z.object({ id: z.uuid() });
export type DeleteVenueInput = z.input<typeof deleteVenueSchema>;

const memberFields = {
  firstName: optionalText(120),
  lastName: optionalText(120),

  name: z.string().trim().min(1, 'A name is required').max(200),
  role: z.enum(MEMBER_TYPES),
  email: z.union([z.email('Enter a valid email address'), z.literal('')]).optional(),
  phone: optionalText(60),
  membershipStatus: z.enum(['active', 'inactive']),

  membershipExpires: z
    .union([
      z
        .string()
        .trim()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a date in YYYY-MM-DD form'),
      z.literal(''),
    ])
    .optional(),
  notes: optionalText(1000),

  extraFields: z.record(z.string().max(120), z.string().max(500)).optional(),
};

export const createMemberSchema = z.object(memberFields);
export type CreateMemberInput = z.input<typeof createMemberSchema>;

export const updateMemberSchema = z.object({ id: z.uuid(), ...memberFields });
export type UpdateMemberInput = z.input<typeof updateMemberSchema>;

export const memberIdSchema = z.object({ id: z.uuid() });

export const importMembersSchema = z.object({
  rows: z.array(z.object(memberFields)).min(1, 'That file had no rows').max(5000),
});

export type ImportMembersInput = z.input<typeof importMembersSchema>;

export const addMembersToShowSchema = z.object({
  showId: z.uuid(),
  memberIds: z.array(z.uuid()).min(1, 'Pick at least one person').max(500),
});

export type AddMembersToShowInput = z.input<typeof addMembersToShowSchema>;
