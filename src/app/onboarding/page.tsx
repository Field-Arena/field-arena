import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getStaffProfile } from '@/modules/auth/data/queries';
import { createServerClient } from '@/shared/lib/supabase/server';
import { OnboardingForm } from '@/modules/organizations/ui/onboarding-form';

export const metadata: Metadata = {
  title: 'Complete your organization profile — Field & Arena',
};

/**
 * Organizer onboarding.
 *
 * Outside the (dashboard) group on purpose: the dashboard layout renders the
 * workspace shell, and an organizer who has not filled this in has no shows, no
 * staff and no venue for that shell to be about.
 *
 * Anyone who does not belong here is redirected rather than shown an error —
 * riders and staff without an organization have nothing to complete, and an
 * organizer who has already completed it would otherwise be able to land back on
 * a form that overwrites what they set from the workspace.
 */
export default async function OnboardingPage() {
  const profile = await getStaffProfile();
  if (!profile) redirect('/login');
  if (!profile.org_id) redirect('/dashboard');

  const supabase = await createServerClient();
  const { data: org } = await supabase
    .from('organizations')
    .select('name, email, website, phone, city, region, country')
    .eq('id', profile.org_id)
    .single();

  if (!org) redirect('/dashboard');

  // An email is what the SuperAdmin's "Add Organizer" flow cannot supply for the
  // organization itself — it collects the owner's address, not the office one —
  // so its absence is the signal that this has never been filled in.
  if (org.email) redirect('/dashboard');

  return (
    <OnboardingForm
      defaults={{
        name: org.name,
        email: org.email ?? '',
        website: org.website ?? '',
        phone: org.phone ?? '',
        city: org.city ?? '',
        region: org.region ?? '',
        country: org.country ?? '',
      }}
    />
  );
}
