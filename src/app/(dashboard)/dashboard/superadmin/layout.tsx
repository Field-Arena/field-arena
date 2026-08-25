import { redirect } from 'next/navigation';
import { getStaffProfile } from '@/modules/auth/data/queries';
import { getImpersonatedOrgId } from '@/shared/lib/impersonation';

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
