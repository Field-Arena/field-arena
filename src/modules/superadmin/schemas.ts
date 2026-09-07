import { z } from 'zod';
import { GRANTABLE_ROLES } from '@/shared/constants/roles';
import { PERMISSION_KEYS } from '@/shared/constants/permissions';

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value === '' ? undefined : value));

export const createOrganizationSchema = z.object({
  name: z.string().trim().min(2, 'Organization name is required').max(160),

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

export const resendOrganizerInviteSchema = z.object({
  orgId: z.uuid(),
});

export type ResendOrganizerInviteInput = z.input<typeof resendOrganizerInviteSchema>;

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

export const addSuperAdminSchema = z.object({
  name: z.string().trim().min(1, 'A name is required').max(120),
  email: z.email('Enter a valid email address'),
});

export type AddSuperAdminInput = z.infer<typeof addSuperAdminSchema>;

export const superAdminIdSchema = z.object({ id: z.uuid() });

export type SuperAdminIdInput = z.infer<typeof superAdminIdSchema>;

export const addOrgStaffSchema = z.object({
  showId: z.uuid('Choose a show'),
  // Legacy required a real name (first + last) before it would send the invite
  // -- the invite email greets them by first name, and the staff row is what
  // every roster and permissions screen shows afterwards.
  firstName: z.string().trim().min(1, 'First name is required').max(80),
  lastName: z.string().trim().max(80).optional().default(''),
  name: z.string().trim().min(1, 'A name is required').max(120),
  email: z.email('Enter a valid email address'),
  role: z.enum(GRANTABLE_ROLES),
});

export type AddOrgStaffInput = z.input<typeof addOrgStaffSchema>;

export const changeStaffRoleSchema = z.object({
  staffId: z.uuid(),
  role: z.enum(GRANTABLE_ROLES),
});

export type ChangeStaffRoleInput = z.infer<typeof changeStaffRoleSchema>;

export const updateStaffPermissionsSchema = z.object({
  staffId: z.uuid(),
  permissions: z.record(z.enum(PERMISSION_KEYS), z.boolean()),
});

export type UpdateStaffPermissionsInput = z.infer<typeof updateStaffPermissionsSchema>;

export const staffIdSchema = z.object({ staffId: z.uuid() });

export type StaffIdInput = z.infer<typeof staffIdSchema>;

const LEAD_STATUS_VALUES = [
  'new',
  'demo_scheduled',
  'demo_completed',
  'onboarding',
  'customer',
  'lost',
] as const;

const blankToUndef = z
  .string()
  .trim()
  .optional()
  .transform((v) => {
    if (v && v.length > 0) return v;
    return undefined;
  });

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

export const toggleChecklistItemSchema = z.object({
  id: z.uuid(),
  itemId: z.string().min(1),
  done: z.boolean(),
});

export type ToggleChecklistItemInput = z.infer<typeof toggleChecklistItemSchema>;

export type LeadIdInput = z.infer<typeof leadIdSchema>;

const SHEET_FAMILY_VALUES = ['movement', 'freestyle', 'weighted', 'placing', 'unassigned'] as const;

/* Every field the legacy catalog editor persisted, family by family
 * (superadmin.html's famDef/mvEditor/fsEditor/wtEditor/plEditor). Movements
 * carry BOTH `n` and `num` and collectives BOTH `key`/`label` and `name`, so a
 * sheet written here is readable by the scoring engine's parser
 * (parse-test-movements / parse-test-collectives) as well as by anything still
 * expecting the legacy key names. */
export const movementItemSchema = z.object({
  n: z.number().int().min(1),
  num: z.number().int().min(1).optional(),
  text: z.string().max(1000),
  directives: z.string().max(2000).optional(),
  actions: z.array(z.string().max(500)).max(60).optional(),
  coef: z.number().min(0).max(20),
});

export type MovementItem = z.infer<typeof movementItemSchema>;

export const collectiveItemSchema = z.object({
  key: z.string().max(80).optional(),
  name: z.string().max(200),
  label: z.string().max(200).optional(),
  note: z.string().max(1000).optional(),
  coef: z.number().min(0).max(20),
});

export type CollectiveItem = z.infer<typeof collectiveItemSchema>;

/** Freestyle — Technical panel row. */
export const technicalItemSchema = z.object({
  name: z.string().max(200),
  criteria: z.string().max(2000).optional(),
});

export type TechnicalItem = z.infer<typeof technicalItemSchema>;

/** Freestyle — Artistic panel row (coefficient-weighted). */
export const artisticItemSchema = z.object({
  name: z.string().max(200),
  coef: z.number().min(0).max(20),
  criteria: z.string().max(2000).optional(),
});

export type ArtisticItem = z.infer<typeof artisticItemSchema>;

/** Weighted / 100 — a scored category section summed toward 100. */
export const categoryItemSchema = z.object({
  name: z.string().max(200),
  weight: z.number().min(0).max(100),
  criteria: z.string().max(2000).optional(),
});

export type CategoryItem = z.infer<typeof categoryItemSchema>;

export const sheetDefSchema = z
  .object({
    // Movement masthead
    intro: z.string().max(2000).optional(),
    purpose: z.string().max(2000).optional(),
    arena: z.string().max(200).optional(),
    rideTime: z.string().max(200).optional(),
    maxPoints: z.number().min(0).max(100000).optional(),
    errorScheduleText: z.string().max(500).optional(),
    footNote: z.string().max(2000).optional(),
    movements: z.array(movementItemSchema).optional(),
    collectives: z.array(collectiveItemSchema).optional(),
    // Freestyle
    technical: z.array(technicalItemSchema).optional(),
    artistic: z.array(artisticItemSchema).optional(),
    // Weighted / 100
    categories: z.array(categoryItemSchema).optional(),
    // Placing
    method: z.string().max(2000).optional(),
    criteria: z.string().max(4000).optional(),
  })
  .catchall(z.unknown());

export type SheetDef = z.infer<typeof sheetDefSchema>;

export const createSheetSchema = z.object({
  title: z.string().trim().min(1, 'A sheet title is required').max(200),
  source: z.enum(['manual', 'parsed', 'typical']).nullable().optional(),
  level: blankToUndef,
  discipline: z.string().trim().optional(),
  family: z.enum(SHEET_FAMILY_VALUES),
  governingBody: blankToUndef,
  sourceFile: blankToUndef,
});

export type CreateSheetInput = z.input<typeof createSheetSchema>;

export const updateSheetSchema = z.object({
  id: z.uuid(),
  title: z.string().trim().min(1).max(200).optional(),
  level: z.string().trim().nullish(),
  discipline: z.string().trim().optional(),
  family: z.enum(SHEET_FAMILY_VALUES).optional(),
  governingBody: z.string().trim().nullish(),
  source: z.enum(['manual', 'parsed', 'typical']).nullable().optional(),
  def: sheetDefSchema.optional(),
});

export type UpdateSheetInput = z.input<typeof updateSheetSchema>;

export const sheetIdSchema = z.object({ id: z.uuid() });

export type SheetIdInput = z.infer<typeof sheetIdSchema>;

export const uploadDocumentSchema = z.object({
  folder: z.string().trim().min(1).max(60),
  name: z.string().trim().min(1, 'A file name is required').max(300),
  dataBase64: z.string().min(1, 'File data is required'),
  contentType: z.string().max(200).optional(),
});

export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;

export const documentIdSchema = z.object({ id: z.uuid() });

export type DocumentIdInput = z.infer<typeof documentIdSchema>;

export const moveDocumentSchema = z.object({
  id: z.uuid(),
  folder: z.string().trim().min(1).max(60),
});

export type MoveDocumentInput = z.infer<typeof moveDocumentSchema>;

export const moveDocumentsSchema = z.object({
  ids: z.array(z.uuid()).min(1),
  folder: z.string().trim().min(1).max(60),
});

export type MoveDocumentsInput = z.infer<typeof moveDocumentsSchema>;

export const renameDocumentSchema = z.object({
  id: z.uuid(),
  name: z.string().trim().min(1, 'A file name is required').max(300),
});

export type RenameDocumentInput = z.infer<typeof renameDocumentSchema>;

export const rematchDocumentsSchema = z.object({
  renames: z.array(renameDocumentSchema).min(1),
});

export type RematchDocumentsInput = z.infer<typeof rematchDocumentsSchema>;

export const updateSettlementSchema = z.object({
  id: z.uuid(),
  payoutCadence: z.enum(['daily', 'weekly']),
  holdbackPercent: z
    .number()
    .min(0, 'Holdback cannot be negative')
    .max(100, 'Holdback cannot exceed 100%')
    .nullable(),
});

export type UpdateSettlementInput = z.infer<typeof updateSettlementSchema>;
