import { redirect } from 'next/navigation';
import { getStaffProfile } from '@/modules/auth/data/queries';
import { getImpersonatedOrgId } from '@/modules/superadmin/data/impersonation';

/**
 * Access control + workspace coherence for the whole SuperAdmin console.
 *
 * Every /dashboard/superadmin/* page renders through this layout, so the
 * SuperAdmin check lives here once and gates them all — the nested pages
 * (users, sales, catalog, documents, billing) don't repeat it. This is
 * defense in depth: the console's write actions are already gated by
 * requireSuperAdmin() and RLS, but a non-SuperAdmin (e.g. a Show Admin) should
 * never even see the console UI, so we bounce them to their own dashboard
 * rather than render platform-wide chrome they can't use.
 *
 * The second guard keeps the console and the impersonated organizer workspace
 * from overlapping: the parent layout renders the organizer shell while
 * impersonation is active, so a console route reached in that state would stitch
 * two workspaces together. The banner's Exit control is the way back.
 */
export default async function SuperAdminSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getStaffProfile();
  if (profile?.platform_role !== 'SuperAdmin') {
    redirect('/dashboard');
  }

  if (await getImpersonatedOrgId()) {
    redirect('/dashboard');
  }

  return <>{children}</>;
}
