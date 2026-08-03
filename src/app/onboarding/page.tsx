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

  /**
   * `website`/`phone` are what the SuperAdmin's "Add Organizer" flow cannot
   * supply for the organization itself — createOrganizationSchema has no
   * fields for either — so either one being set is the real signal that this
   * form has already been submitted once.
   *
   * `email` used to be that signal, but createOrganization (superadmin/data/
   * mutations.ts) writes the owner's own contact address into
   * organizations.email at creation time now, so it can no longer distinguish
   * "onboarding done" from "just invited" — it is always set by the time this
   * page could possibly run. Gating on it made this page unreachable: every
   * freshly invited organizer bounced straight to /dashboard, having never
   * seen the form. website/phone were never touched by that flow and stay a
   * reliable signal.
   */
  if (org.website || org.phone) redirect('/dashboard');

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
