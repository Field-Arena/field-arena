import { redirect } from 'next/navigation';
import './dashboard.css';
import { OrganizerShell } from '@/modules/staff/ui/organizer-shell';
import { SuperAdminShell } from '@/modules/superadmin/ui/superadmin-shell';
import { PendingWorkspace } from '@/shared/ui/pending-workspace';
import { getRiderProfile, getStaffProfile } from '@/modules/auth/data/queries';
import { getImpersonatedOrgId } from '@/shared/lib/impersonation';
import { getPreviewingAsShowAdmin } from '@/modules/staff/data/preview-role';
import { getSelectedOrg, getOrganizationName } from '@/modules/staff/data/org-selection';
import { getUserWorkspaceRoles } from '@/modules/staff/data/workspace-roles';
import { getRailRole } from '@/shared/lib/rail-role';
import { listOrganizerOptions } from '@/modules/superadmin/data/queries';
import { ROLE_WORKSPACES, RIDER_WORKSPACE } from '@/shared/constants/role-workspaces';
import { ROUTES } from '@/shared/constants/routes';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const profile = await getStaffProfile();

  if (!profile) {
    const rider = await getRiderProfile();
    if (rider) {
      redirect(RIDER_WORKSPACE.href);
    }
    redirect(`${ROUTES.login}?error=no_profile`);
  }

  const role = profile.platform_role;

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

  const impersonating = role === 'SuperAdmin' ? await getImpersonatedOrgId() : null;

  if (role === 'SuperAdmin' && !impersonating) {
    // Deleted and demo orgs are filtered out inside the query, for the same
    // reason they're out of the console's table. A switcher is a convenience:
    // if its list can't be loaded, the dashboard must still render, so this
    // degrades to an empty list rather than throwing out of the layout.
    const [activeRailRole, organizers] = await Promise.all([
      getRailRole().then((r) => r ?? role),
      listOrganizerOptions().catch(() => []),
    ]);

    return (
      <SuperAdminShell profile={profile} activeRailRole={activeRailRole} organizers={organizers}>
        {children}
      </SuperAdminShell>
    );
  }

  const previewingAsShowAdmin = await getPreviewingAsShowAdmin();

  // The banner names the organizer whose live data is being edited — "viewing
  // as an organizer" alone doesn't say which one, and the whole point of the
  // warning is knowing whose records a write lands on.
  const impersonatedOrgName = impersonating ? await getOrganizationName(impersonating) : null;

  const railRoleCookie = impersonating ? await getRailRole() : null;
  const shellRole = previewingAsShowAdmin ? 'ShowAdmin' : impersonating ? 'Organizer' : role;
  const shellWorkspace = ROLE_WORKSPACES[shellRole] ?? workspace;

  const { orgId: selectedOrgId, memberOrgs } = impersonating
    ? { orgId: null, memberOrgs: [] }
    : await getSelectedOrg(profile);

  // Workspaces this staff user may switch between (their platform_role + any
  // per-show staff roles). Only meaningful for genuine non-SuperAdmin staff —
  // the SuperAdmin rail already shows every role.
  const availableRoles =
    role === 'SuperAdmin' || impersonating ? [] : await getUserWorkspaceRoles(profile);

  return (
    <OrganizerShell
      profile={profile}
      workspace={shellWorkspace}
      impersonating={impersonating !== null}
      impersonatedOrgName={impersonatedOrgName}
      previewingAsShowAdmin={previewingAsShowAdmin}
      railRoleCookie={railRoleCookie}
      selectedOrgId={selectedOrgId}
      memberOrgs={memberOrgs}
      availableRoles={availableRoles}
    >
      {children}
    </OrganizerShell>
  );
}
