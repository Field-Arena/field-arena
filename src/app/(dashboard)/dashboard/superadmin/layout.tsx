import { redirect } from 'next/navigation';
import { getStaffProfile } from '@/shared/lib/auth/session';
import { getImpersonatedOrgId } from '@/shared/lib/auth/view-as';

export default async function SuperAdminSectionLayout({ children }: { children: React.ReactNode }) {
  const profile = await getStaffProfile();
  if (profile?.platform_role !== 'SuperAdmin') {
    redirect('/dashboard');
  }

  if (await getImpersonatedOrgId()) {
    redirect('/dashboard');
  }

  return <>{children}</>;
}
