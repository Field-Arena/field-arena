import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getStaffProfile } from '@/modules/auth/data/queries';
import { createServerClient } from '@/shared/lib/supabase/server';
import { OnboardingForm } from '@/modules/organizations/ui/onboarding-form';

export const metadata: Metadata = {
  title: 'Complete your organization profile — Field & Arena',
};

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
