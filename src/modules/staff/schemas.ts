import { z } from 'zod';
import { ADD_USER_ROLES } from './constants';
import { GRANTABLE_ROLES } from '@/shared/constants/roles';
import { PERMISSION_KEYS } from '@/shared/constants/permissions';

export const addStaffUserSchema = z.object({
  showId: z.uuid('Choose a show'),
  // Required, split first/last — matches the legacy Add-a-User modal
  // (openAddUserModal's nameFieldsHtml) and this same file's own
  // importStaffRowSchema below, rather than the single optional "name" field
  // this form briefly had.
  firstName: z.string().trim().min(1, 'First name is required').max(80),
  lastName: z.string().trim().min(1, 'Last name is required').max(80),
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
