import { z } from 'zod';

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
