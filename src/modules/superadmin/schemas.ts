import { z } from 'zod';
import { GRANTABLE_ROLES } from '@/shared/constants/roles';
import { PERMISSION_KEYS } from '@/shared/constants/permissions';

/**
 * Field sets taken from the legacy console's own modals: openAddOrgModal and
 * openEditOrgModal in public/views/superadmin.html, and the PATCH body accepted
 * by api/organizations.js line 368.
 */

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value === '' ? undefined : value));

export const createOrganizationSchema = z.object({
  name: z.string().trim().min(2, 'Organization name is required').max(160),

  /**
   * The first Organizer to invite. Legacy's add-organizer modal collected first
   * name, last name, title and email, then created the organization and its
   * owner invite in one step — an organization with no owner cannot be
   * administered by anyone but a SuperAdmin, so the two belong together.
   */
  contactFirstName: z.string().trim().min(1, 'First name is required').max(80),
  contactLastName: z.string().trim().min(1, 'Last name is required').max(80),
  contactTitle: optionalText(120),
  contactEmail: z.email('Enter a valid email address'),

  city: optionalText(120),
  region: optionalText(120),
  country: optionalText(120),

  feeModel: z.enum(['default', 'gmo']).default('default'),
});

export type CreateOrganizationInput = z.input<typeof createOrganizationSchema>;

export const updateOrganizationSchema = z.object({
  id: z.uuid(),
  name: z.string().trim().min(2, 'Organization name is required').max(160),
  email: z.union([z.email('Enter a valid email address'), z.literal('')]).optional(),
  phone: optionalText(60),
  website: optionalText(200),
  city: optionalText(120),
  region: optionalText(120),
  country: optionalText(120),
  feeModel: z.enum(['default', 'gmo']),
});

export type UpdateOrganizationInput = z.input<typeof updateOrganizationSchema>;

export const organizationFlagSchema = z.object({
  id: z.uuid(),
  value: z.boolean(),
});

export type OrganizationFlagInput = z.infer<typeof organizationFlagSchema>;

/**
 * "Add Super Admin", from the legacy console's openAddSuperAdminModal — name and
 * email only. Every Super Admin has identical, platform-wide access, so there is
 * nothing else to collect: no org, no per-show scope, no permissions.
 */
export const addSuperAdminSchema = z.object({
  name: z.string().trim().min(1, 'A name is required').max(120),
  email: z.email('Enter a valid email address'),
});

export type AddSuperAdminInput = z.infer<typeof addSuperAdminSchema>;

/** Removing a Super Admin or cancelling a pending Super Admin invite. */
export const superAdminIdSchema = z.object({ id: z.uuid() });

export type SuperAdminIdInput = z.infer<typeof superAdminIdSchema>;

/**
 * Adding an organizer staff member, from the directory's "Add a user" modal.
 * Staff are per-show, so a show is required alongside the email and role.
 */
export const addOrgStaffSchema = z.object({
  showId: z.uuid('Choose a show'),
  name: z.string().trim().max(120).optional().transform((v) => (v === '' ? undefined : v)),
  email: z.email('Enter a valid email address'),
  role: z.enum(GRANTABLE_ROLES),
});

export type AddOrgStaffInput = z.input<typeof addOrgStaffSchema>;

/** Changing one staff member's role from the directory's inline dropdown. */
export const changeStaffRoleSchema = z.object({
  staffId: z.uuid(),
  role: z.enum(GRANTABLE_ROLES),
});

export type ChangeStaffRoleInput = z.infer<typeof changeStaffRoleSchema>;

/** Saving the per-person permission toggles. */
export const updateStaffPermissionsSchema = z.object({
  staffId: z.uuid(),
  permissions: z.record(z.enum(PERMISSION_KEYS), z.boolean()),
});

export type UpdateStaffPermissionsInput = z.infer<typeof updateStaffPermissionsSchema>;

/** Removing a staff assignment. */
export const staffIdSchema = z.object({ staffId: z.uuid() });

export type StaffIdInput = z.infer<typeof staffIdSchema>;

// ── Sales funnel (leads) ─────────────────────────────────────────────────────

const LEAD_STATUS_VALUES = [
  'new',
  'demo_scheduled',
  'demo_completed',
  'onboarding',
  'customer',
  'lost',
] as const;

/** Empty string → undefined, so a blank optional field clears rather than stores "". */
const blankToUndef = z
  .string()
  .trim()
  .optional()
  .transform((v) => {
    if (v && v.length > 0) return v;
    return undefined;
  });

/**
 * Add Target modal — the manually-sourced lead. A lead always lands as "new".
 *
 * showsPerYear stays a string here (it comes from a text input) so the schema's
 * input and output types match, which react-hook-form's resolver requires. The
 * mutation parses it to an integer.
 */
export const createLeadSchema = z.object({
  orgName: z.string().trim().min(1, 'An organization name is required').max(200),
  contactName: blankToUndef,
  email: blankToUndef,
  phone: blankToUndef,
  website: blankToUndef,
  showsPerYear: blankToUndef,
});

export type CreateLeadInput = z.input<typeof createLeadSchema>;

export const checklistItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  done: z.boolean(),
});

export type ChecklistItem = z.infer<typeof checklistItemSchema>;

/** Any subset of editable lead fields, from the detail page's several Save actions. */
export const updateLeadSchema = z.object({
  id: z.uuid(),
  orgName: z.string().trim().min(1).max(200).optional(),
  contactName: z.string().trim().max(200).nullish(),
  email: z.string().trim().max(200).nullish(),
  phone: z.string().trim().max(60).nullish(),
  website: z.string().trim().max(200).nullish(),
  status: z.enum(LEAD_STATUS_VALUES).optional(),
  notes: z.string().max(8000).nullish(),
  showsPerYear: z.number().int().min(0).max(100000).nullish(),
  costPerEvent: z.number().min(0).max(1_000_000_000).nullish(),
  avgRevenuePerShow: z.number().min(0).max(1_000_000_000).nullish(),
  onboardingAt: z.string().nullish(),
  onboardingChecklist: z.array(checklistItemSchema).optional(),
});

export type UpdateLeadInput = z.input<typeof updateLeadSchema>;

export const leadIdSchema = z.object({ id: z.uuid() });

export type LeadIdInput = z.infer<typeof leadIdSchema>;

// ── Scoring catalog ──────────────────────────────────────────────────────────

const SHEET_FAMILY_VALUES = [
  'movement',
  'freestyle',
  'weighted',
  'placing',
  'unassigned',
] as const;

/** One numbered movement on a movement-family sheet. */
export const movementItemSchema = z.object({
  n: z.number().int().min(1),
  text: z.string().max(1000),
  coef: z.number().min(0).max(20),
});

export type MovementItem = z.infer<typeof movementItemSchema>;

/** One collective mark (Gaits, Impulsion, …). */
export const collectiveItemSchema = z.object({
  name: z.string().max(200),
  coef: z.number().min(0).max(20),
});

export type CollectiveItem = z.infer<typeof collectiveItemSchema>;

/**
 * The `def` jsonb for a sheet. The header fields and the movement/collective
 * arrays are what the editor touches; catchall keeps any other keys a seed or a
 * future family put there rather than dropping them on save.
 */
export const sheetDefSchema = z
  .object({
    arena: z.string().max(200).optional(),
    rideTime: z.string().max(200).optional(),
    maxPoints: z.number().min(0).max(100000).optional(),
    intro: z.string().max(2000).optional(),
    errorScheduleText: z.string().max(500).optional(),
    movements: z.array(movementItemSchema).optional(),
    collectives: z.array(collectiveItemSchema).optional(),
  })
  .catchall(z.unknown());

export type SheetDef = z.infer<typeof sheetDefSchema>;

/** "Upload official sheet" — creates a catalog stub. Only a title is required. */
export const createSheetSchema = z.object({
  title: z.string().trim().min(1, 'A sheet title is required').max(200),
  level: blankToUndef,
  discipline: z.string().trim().optional(),
  family: z.enum(SHEET_FAMILY_VALUES),
  governingBody: blankToUndef,
  sourceFile: blankToUndef,
});

export type CreateSheetInput = z.input<typeof createSheetSchema>;

/** Any subset of a sheet's fields, from the detail editor's Save. */
export const updateSheetSchema = z.object({
  id: z.uuid(),
  title: z.string().trim().min(1).max(200).optional(),
  level: z.string().trim().nullish(),
  discipline: z.string().trim().optional(),
  family: z.enum(SHEET_FAMILY_VALUES).optional(),
  governingBody: z.string().trim().nullish(),
  source: z.string().trim().nullish(),
  def: sheetDefSchema.optional(),
});

export type UpdateSheetInput = z.input<typeof updateSheetSchema>;

export const sheetIdSchema = z.object({ id: z.uuid() });

export type SheetIdInput = z.infer<typeof sheetIdSchema>;

// ── Documents (catalog file store) ───────────────────────────────────────────

/** Uploading a file: the bytes arrive base64-encoded from the client. */
export const uploadDocumentSchema = z.object({
  folder: z.string().trim().min(1).max(60),
  name: z.string().trim().min(1, 'A file name is required').max(300),
  dataBase64: z.string().min(1, 'File data is required'),
  contentType: z.string().max(200).optional(),
});

export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;

export const documentIdSchema = z.object({ id: z.uuid() });

export type DocumentIdInput = z.infer<typeof documentIdSchema>;

/** Moving a file between folders (Tests ↔ Documents). */
export const moveDocumentSchema = z.object({
  id: z.uuid(),
  folder: z.string().trim().min(1).max(60),
});

export type MoveDocumentInput = z.infer<typeof moveDocumentSchema>;
