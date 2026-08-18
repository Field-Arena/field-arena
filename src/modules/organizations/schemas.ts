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

/**
 * The organizer's own onboarding form — "Complete Your Organization Profile".
 *
 * Deliberately narrower than the SuperAdmin's updateOrganizationSchema, which
 * carries an org id and a fee model. Neither belongs here:
 *
 *  - There is no id. The organization is resolved from the caller's own profile
 *    server-side. Accepting one would mean a signed-in organizer could post
 *    somebody else's org id and rewrite their contact details — RLS would very
 *    likely stop it, but the field has no reason to exist in the first place.
 *
 *  - There is no fee model. What the platform charges an organizer is the
 *    platform owner's decision, and this form is filled in by the organizer.
 *
 * Name and email are the two the design marks required; everything else can be
 * added later from the workspace.
 */
export const completeOrgProfileSchema = z.object({
  name: z.string().trim().min(2, 'Organization name is required').max(160),
  email: z.email('Enter a valid email address'),
  website: optionalText(200),
  phone: optionalText(60),
  city: optionalText(120),
  region: optionalText(120),
  country: optionalText(120),
});

export type CompleteOrgProfileInput = z.input<typeof completeOrgProfileSchema>;

/**
 * Adding a person to the org-wide member database — independent of any show
 * staffing/entry. Matches the legacy Add-a-User modal's "Also a member of
 * your organization" section (showstaff.html's `maybeAddToMemberDatabase`).
 */
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

/* ── Venue library ────────────────────────────────────────────────────────
   Add/edit for the org's reusable venue library — showstaff.html's
   locationEditorHtml (~line 5296), one form for name/address/contact, a
   saved ring layout, and a saved stable/stall layout, all persisted together
   on Save (legacy's saveLocationAction PATCHes name/address/website/phone/
   contact/rings/stables in one request; there is no separate save path for
   the stall grid — see stable-config-dialog.tsx). */

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

/**
 * The name/address/contact subset only, for the dialog's react-hook-form —
 * rings/stables are edited as plain component state instead (see
 * venue-form-dialog.tsx's doc comment for why: matching VenueCard's own
 * pattern, and sidestepping `z.coerce.number()`'s input type on
 * stables[].rowCount, which is not a value a controlled `<input>` can hold
 * directly).
 */
export const venueDetailsSchema = venueFormSchema.omit({ rings: true, stables: true });
export type VenueDetailsInput = z.input<typeof venueDetailsSchema>;

export const createVenueSchema = venueFormSchema;
export type CreateVenueInput = z.input<typeof createVenueSchema>;

export const updateVenueSchema = venueFormSchema.extend({ id: z.uuid() });
export type UpdateVenueInput = z.input<typeof updateVenueSchema>;

export const deleteVenueSchema = z.object({ id: z.uuid() });
export type DeleteVenueInput = z.input<typeof deleteVenueSchema>;

/* ── Member Database ─────────────────────────────────────────────────────
   Ported from showstaff.html's openAddMemberModal / saveMemberEdit /
   member upload / addSelectedMembersToShow. */

const memberFields = {
  /** Businesses (Vendor) carry one name; people carry two and the display name is derived. */
  firstName: optionalText(120),
  lastName: optionalText(120),
  /** Sent for a business, or derived from first/last for a person. */
  name: z.string().trim().min(1, 'A name is required').max(200),
  role: z.enum(MEMBER_TYPES),
  email: z.union([z.email('Enter a valid email address'), z.literal('')]).optional(),
  phone: optionalText(60),
  membershipStatus: z.enum(['active', 'inactive']),
  /** ISO 'YYYY-MM-DD', matching the column. */
  membershipExpires: z
    .union([z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a date in YYYY-MM-DD form'), z.literal('')])
    .optional(),
  notes: optionalText(1000),
  /** Columns an import brought in beyond the fields above. */
  extraFields: z.record(z.string().max(120), z.string().max(500)).optional(),
};

export const createMemberSchema = z.object(memberFields);
export type CreateMemberInput = z.input<typeof createMemberSchema>;

export const updateMemberSchema = z.object({ id: z.uuid(), ...memberFields });
export type UpdateMemberInput = z.input<typeof updateMemberSchema>;

export const memberIdSchema = z.object({ id: z.uuid() });

/**
 * A parsed CSV upload.
 *
 * Rows are validated here rather than on the client so a malformed file cannot
 * reach the table, and capped because an import is a paste-in convenience, not
 * a bulk migration path.
 */
export const importMembersSchema = z.object({
  rows: z.array(z.object(memberFields)).min(1, 'That file had no rows').max(5000),
});

export type ImportMembersInput = z.input<typeof importMembersSchema>;

export const addMembersToShowSchema = z.object({
  showId: z.uuid(),
  memberIds: z.array(z.uuid()).min(1, 'Pick at least one person').max(500),
});

export type AddMembersToShowInput = z.input<typeof addMembersToShowSchema>;
