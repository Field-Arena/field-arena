'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/shared/lib/supabase/server';
import { getStaffProfile } from '@/modules/auth/data/queries';
import { completeOrgProfileSchema } from '../schemas';

/**
 * Writes an organizer's own organization profile, from the onboarding screen.
 *
 * The organization is taken from the caller's profile rather than the request
 * body — see the schema for why. A ShowAdmin has org_id null by design and is
 * refused here: their access comes from a staff_assignments row for one show,
 * which is not authority over the organization's identity.
 */
export async function completeOrganizationProfile(input: unknown): Promise<void> {
  const parsed = completeOrgProfileSchema.parse(input);

  const profile = await getStaffProfile();
  if (!profile) throw new Error('Not signed in.');
  if (!profile.org_id) {
    throw new Error('Your account is not the owner of an organization.');
  }

  const supabase = await createServerClient();
  const { error } = await supabase
    .from('organizations')
    .update({
      name: parsed.name,
      email: parsed.email,
      website: parsed.website ?? null,
      phone: parsed.phone ?? null,
      city: parsed.city ?? null,
      region: parsed.region ?? null,
      country: parsed.country ?? null,
    })
    .eq('id', profile.org_id);

  if (error) throw new Error(error.message);

  revalidatePath('/dashboard');
}
