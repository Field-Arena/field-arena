import { redirect } from 'next/navigation';
import './dashboard.css';
import { OrganizerShell } from '@/modules/staff/ui/organizer-shell';
import { SuperAdminShell } from '@/modules/superadmin/ui/superadmin-shell';
import { PendingWorkspace } from '@/shared/ui/pending-workspace';
import { getRiderProfile, getStaffProfile } from '@/modules/auth/data/queries';
import { getImpersonatedOrgId } from '@/shared/lib/impersonation';
import { getPreviewingAsShowAdmin } from '@/modules/staff/data/preview-role';
import { getSelectedOrg } from '@/modules/staff/data/org-selection';
import { getRailRole } from '@/shared/lib/rail-role';
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
    const activeRailRole = (await getRailRole()) ?? role;
    return (
      <SuperAdminShell profile={profile} activeRailRole={activeRailRole}>
        {children}
      </SuperAdminShell>
    );
  }

  const previewingAsShowAdmin = await getPreviewingAsShowAdmin();

  const railRoleCookie = impersonating ? await getRailRole() : null;
  const shellRole = previewingAsShowAdmin ? 'ShowAdmin' : impersonating ? 'Organizer' : role;
  const shellWorkspace = ROLE_WORKSPACES[shellRole] ?? workspace;

  const { orgId: selectedOrgId, memberOrgs } = impersonating
    ? { orgId: null, memberOrgs: [] }
    : await getSelectedOrg(profile);

  return (
    <OrganizerShell
      profile={profile}
      workspace={shellWorkspace}
      impersonating={impersonating !== null}
      previewingAsShowAdmin={previewingAsShowAdmin}
      railRoleCookie={railRoleCookie}
      selectedOrgId={selectedOrgId}
      memberOrgs={memberOrgs}
    >
      {children}
    </OrganizerShell>
  );
}
