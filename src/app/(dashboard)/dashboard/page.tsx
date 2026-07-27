import { redirect } from 'next/navigation';
import { DashboardOverview } from '@/modules/staff/ui/dashboard-overview';
import { getStaffProfile } from '@/modules/auth/data/queries';
import { ROLE_WORKSPACES } from '@/shared/constants/role-workspaces';

/**
 * /dashboard is the organizer overview, and also the generic landing path that
 * middleware and the login form redirect to. A SuperAdmin arriving here is
 * forwarded to their own console rather than shown the organizer view inside the
 * console shell.
 */
export default async function DashboardPage() {
  const profile = await getStaffProfile();
  const role = profile?.platform_role;

  if (role && role !== 'Organizer' && role !== 'ShowAdmin') {
    const workspace = ROLE_WORKSPACES[role];
    if (workspace && workspace.href !== '/dashboard') {
      redirect(workspace.href);
    }
  }

  return <DashboardOverview />;
}
