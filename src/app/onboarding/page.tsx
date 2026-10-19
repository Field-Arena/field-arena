import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getStaffProfile } from '@/shared/lib/auth/session';
import { getSelectedOrg } from '@/modules/staff/data/org-selection-queries';
import { getOrganizationProfile } from '@/modules/organizations/data/queries';
import { OnboardingForm } from '@/modules/organizations/ui/onboarding-form';

export const metadata: Metadata = {
  title: 'Complete your organization profile — Field & Arena',
};

export default async function OnboardingPage() {
  const profile = await getStaffProfile();
  if (!profile) redirect('/login');
  if (!profile.org_id) redirect('/dashboard');

  // The same org completeOrganizationProfile saves to: the switcher-selected
  // org, falling back to the home org.
  const { orgId: selectedOrgId } = await getSelectedOrg();
  const org = await getOrganizationProfile(selectedOrgId ?? profile.org_id);

  if (!org) redirect('/dashboard');

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
