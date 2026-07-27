import { redirect } from 'next/navigation';
import './dashboard.css';
import { OrganizerShell } from '@/modules/staff/ui/organizer-shell';
import { PendingWorkspace } from '@/shared/ui/pending-workspace';
import { getRiderProfile, getStaffProfile } from '@/modules/auth/data/queries';
import { ROLE_WORKSPACES, RIDER_WORKSPACE } from '@/shared/constants/role-workspaces';
import { ROUTES } from '@/shared/constants/routes';

/**
 * Auth-gated workspace shell, dispatching on the signed-in user's role.
 *
 * The guard checks for a staff *profile*, not merely a session, and that
 * distinction matters. Middleware can see whether a session exists but cannot
 * cheaply tell whether it maps to a row in public.users. An authenticated
 * account with no profile row passes every session check and then reads nothing
 * from any table, because RLS resolves the caller's role through that profile —
 * so the workspace renders fully with every panel empty, which looks like a
 * broken app rather than a permissions problem. Accounts predating the schema
 * rebuild are in exactly that state, so this is a live case.
 *
 * Roles whose workspace is not migrated get an explicit placeholder rather than
 * a fallback to the Organizer workspace. See PendingWorkspace for why showing
 * the wrong workspace is worse than showing none.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const profile = await getStaffProfile();

  if (!profile) {
    // A rider reaching a staff route is not an error — they have a real account,
    // just in the other identity table. Send them to their own portal instead of
    // an "unauthorized" dead end.
    const rider = await getRiderProfile();
    if (rider) {
      redirect(RIDER_WORKSPACE.href);
    }
    redirect(`${ROUTES.login}?error=no_profile`);
  }

  const role = profile.platform_role;

  // platform_role is nullable, and its CHECK constraint admits values that have
  // no workspace, so both of these are reachable without a data bug.
  const workspace = role ? ROLE_WORKSPACES[role] : undefined;

  if (!role || !workspace) {
    return (
      <PendingWorkspace
        workspace={{
          key: 'unknown',
          title: 'No workspace assigned',
          hint: 'This account does not have a platform role set, so there is no workspace to open.',
          href: ROUTES.dashboard,
          status: 'pending',
          legacyView: '—',
        }}
        roleLabel={role ?? 'none'}
        userName={profile.name}
      />
    );
  }

  if (workspace.status === 'pending') {
    return <PendingWorkspace workspace={workspace} roleLabel={role} userName={profile.name} />;
  }

  return (
    <OrganizerShell profile={profile} workspace={workspace}>
      {children}
    </OrganizerShell>
  );
}
