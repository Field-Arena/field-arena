import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeftIcon } from 'lucide-react';
import { createServerClient } from '@/shared/lib/supabase/server';
import { OnboardingForm } from '@/modules/organizations/ui/onboarding-form';

export const metadata: Metadata = { title: 'Onboarding — SuperAdmin Console' };

/* The real onboarding form, bound to a real organization — what this organizer
 * sees to finish setup, and editable here so a SuperAdmin can fill it in for
 * them over the phone. Legacy loaded the same page against the same org id;
 * a static mock would show plausible fields that save nowhere. */
export default async function OrganizationOnboardingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createServerClient();
  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, email, website, phone, city, region, country')
    .eq('id', id)
    .maybeSingle();

  if (!org) notFound();

  return (
    <div className="space-y-5">
      <Link
        href={`/dashboard/superadmin/organizations/${id}`}
        className="text-fa-muted hover:text-gold inline-flex items-center gap-2 text-[13px] font-semibold transition-colors"
      >
        <ArrowLeftIcon className="size-4" aria-hidden />
        {org.name} — Shows
      </Link>

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-900">
        This is {org.name}&rsquo;s real profile form — anything saved here is saved to their
        account, exactly as if they had filled it in themselves.
      </div>

      <OnboardingForm
        defaults={{
          orgId: org.id,
          name: org.name,
          email: org.email ?? '',
          website: org.website ?? '',
          phone: org.phone ?? '',
          city: org.city ?? '',
          region: org.region ?? '',
          country: org.country ?? '',
        }}
      />
    </div>
  );
}
