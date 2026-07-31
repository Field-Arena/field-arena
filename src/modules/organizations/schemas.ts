import { z } from 'zod';

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
