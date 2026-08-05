import { z } from 'zod';
import { ADD_USER_ROLES } from './constants';
import { GRANTABLE_ROLES } from '@/shared/constants/roles';
import { PERMISSION_KEYS } from '@/shared/constants/permissions';

export const addStaffUserSchema = z
  .object({
    showId: z.uuid('Choose a show'),
    // Split first/last — matches the legacy Add-a-User modal
    // (openAddUserModal's nameFieldsHtml) and this same file's own
    // importStaffRowSchema below. Not required at the object level: a Vendor
    // uses businessName instead (legacy's nameFieldsHtml(id, true) swaps the
    // whole field to a single business-name input for that one role) — the
    // .refine below enforces "one of the two, depending on role" instead.
    firstName: z.string().trim().max(80).optional().default(''),
    lastName: z.string().trim().max(80).optional().default(''),
    businessName: z.string().trim().max(160).optional().default(''),
    email: z.email('Enter a valid email address'),
    role: z.enum(ADD_USER_ROLES),
    isSteward: z.boolean().optional().default(false),
    canScratchSkipDq: z.boolean().optional().default(false),
    canViewMoney: z.boolean().optional().default(false),
    // "Also a member of your organization" — independent of this show
    // assignment, see modules/organizations' addOrgMember.
    addToMemberDatabase: z.boolean().optional().default(false),
    membershipStatus: z.enum(['active', 'inactive']).optional().default('active'),
    membershipExpires: z
      .string()
      .trim()
      .optional()
      .transform((v) => (v === '' ? undefined : v)),
    // Which classes this Judge is on the panel for — ignored for every other
    // role. Matches legacy's judgeClassChecklistHtml/addJudgeToClass: filled
    // in at invite time instead of the organizer opening the person's panel
    // afterward and adding classes one at a time.
    classIds: z.array(z.uuid()).optional().default([]),
  })
  .refine((value) => (value.role === 'Vendor' ? value.businessName.length > 0 : true), {
    message: 'Business name is required',
    path: ['businessName'],
  })
  .refine((value) => (value.role !== 'Vendor' ? value.firstName.length > 0 : true), {
    message: 'First name is required',
    path: ['firstName'],
  })
  .refine((value) => (value.role !== 'Vendor' ? value.lastName.length > 0 : true), {
    message: 'Last name is required',
    path: ['lastName'],
  });
export type AddStaffUserInput = z.input<typeof addStaffUserSchema>;

export const changeStaffRoleSchema = z.object({
  staffId: z.uuid(),
  role: z.enum(GRANTABLE_ROLES),
});
export type ChangeStaffRoleInput = z.input<typeof changeStaffRoleSchema>;

const permissionsRecordSchema = z.record(z.enum(PERMISSION_KEYS), z.boolean());

export const updateStaffPermissionsSchema = z.object({
  staffId: z.uuid(),
  permissions: permissionsRecordSchema,
});
export type UpdateStaffPermissionsInput = z.input<typeof updateStaffPermissionsSchema>;

export const staffIdSchema = z.object({ staffId: z.uuid() });
export type StaffIdInput = z.input<typeof staffIdSchema>;

/** Moves a staff_assignments row to a different show — legacy's PATCH /api/staff/:id showId field. */
export const reassignStaffShowSchema = z.object({
  staffId: z.uuid(),
  showId: z.uuid(),
});
export type ReassignStaffShowInput = z.input<typeof reassignStaffShowSchema>;

/**
 * The name/contact/steward fields of legacy's PATCH /api/staff/:id — every
 * field that handler accepts except role/permissions/showId/status, which
 * already have their own dedicated actions (status has none: see
 * updateStaffDetails's doc comment in data/mutations.ts for why).
 */
export const updateStaffDetailsSchema = z.object({
  staffId: z.uuid(),
  firstName: z.string().trim().min(1, 'First name is required').max(80),
  lastName: z.string().trim().min(1, 'Last name is required').max(80),
  email: z.email('Enter a valid email address'),
  phone: z.string().trim().max(40).optional().default(''),
  // Only meaningful for role='Announcer', matching legacy's conditional
  // um-is-steward checkbox — the UI only renders this control for that role,
  // but the field itself is unconditional here like every other one above.
  isSteward: z.boolean().optional().default(false),
});
export type UpdateStaffDetailsInput = z.input<typeof updateStaffDetailsSchema>;

/** One parsed row from an uploaded staff CSV — see modules/staff/utils.ts's `parseStaffCsv`. */
const importStaffRowSchema = z.object({
  firstName: z.string().trim().max(80),
  lastName: z.string().trim().max(80),
  role: z.string().trim().min(1).max(40),
  phone: z.string().trim().max(40).optional().default(''),
  email: z.email(),
});

export const importStaffListSchema = z.object({
  showId: z.uuid(),
  rows: z.array(importStaffRowSchema).min(1).max(500),
});
export type ImportStaffListInput = z.input<typeof importStaffListSchema>;
