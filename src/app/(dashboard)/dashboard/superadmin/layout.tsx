import { redirect } from 'next/navigation';
import { getImpersonatedOrgId } from '@/modules/superadmin/data/impersonation';

/**
 * Keeps the console and the impersonated organizer workspace from overlapping.
 *
 * The parent layout renders the organizer shell while impersonation is active,
 * so a console route reached in that state would render console content inside
 * organizer chrome — two different workspaces stitched together. Sending them to
 * the organizer dashboard instead is coherent, and the banner's Exit control is
 * the way back.
 */
export default async function SuperAdminSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (await getImpersonatedOrgId()) {
    redirect('/dashboard');
  }

  return <>{children}</>;
}
