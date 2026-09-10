import { z } from 'zod';
import { ADD_USER_ROLES } from './constants';
import { GRANTABLE_ROLES } from '@/shared/constants/roles';
import { PERMISSION_KEYS } from '@/shared/constants/permissions';
import { emailSchema } from '@/shared/schemas/email';

export const addStaffUserSchema = z
  .object({
    showId: z.uuid('Choose a show'),

    firstName: z.string().trim().max(80).optional().default(''),
    lastName: z.string().trim().max(80).optional().default(''),
    businessName: z.string().trim().max(160).optional().default(''),
    email: emailSchema(),
    role: z.enum(ADD_USER_ROLES),
    isSteward: z.boolean().optional().default(false),
    canScratchSkipDq: z.boolean().optional().default(false),
    canViewMoney: z.boolean().optional().default(false),

    addToMemberDatabase: z.boolean().optional().default(false),
    membershipStatus: z.enum(['active', 'inactive']).optional().default('active'),
    membershipExpires: z
      .string()
      .trim()
      .optional()
      .transform((v) => (v === '' ? undefined : v)),

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

export const reassignStaffShowSchema = z.object({
  staffId: z.uuid(),
  showId: z.uuid(),
});
export type ReassignStaffShowInput = z.input<typeof reassignStaffShowSchema>;

export const updateStaffDetailsSchema = z.object({
  staffId: z.uuid(),
  firstName: z.string().trim().min(1, 'First name is required').max(80),
  lastName: z.string().trim().min(1, 'Last name is required').max(80),
  email: emailSchema(),
  phone: z.string().trim().max(40).optional().default(''),

  isSteward: z.boolean().optional().default(false),
});
export type UpdateStaffDetailsInput = z.input<typeof updateStaffDetailsSchema>;

const importStaffRowSchema = z.object({
  firstName: z.string().trim().max(80),
  lastName: z.string().trim().max(80),
  role: z.string().trim().min(1).max(40),
  phone: z.string().trim().max(40).optional().default(''),
  email: emailSchema(),
});

export const importStaffListSchema = z.object({
  showId: z.uuid(),
  rows: z.array(importStaffRowSchema).min(1).max(500),
});
export type ImportStaffListInput = z.input<typeof importStaffListSchema>;
