import { redirect } from 'next/navigation';
import './fa-design.css';
import './dashboard.css';
import { OrganizerShell } from '@/modules/staff/ui/organizer-shell';
import { SuperAdminShell } from '@/modules/superadmin/ui/superadmin-shell';
import { PendingWorkspace } from '@/shared/ui/pending-workspace';
import { SignOutButton } from '@/modules/auth/ui/sign-out-button';
import { WorkspaceUnavailable } from '@/shared/ui/workspace-unavailable';
import { getRiderProfile, getStaffProfile } from '@/shared/lib/auth/session';
import { getImpersonatedOrgId, getRailRole } from '@/shared/lib/auth/view-as';
import { getPreviewingAsShowAdmin } from '@/modules/staff/data/preview-role';
import { getSelectedOrg, getOrganizationName } from '@/modules/staff/data/org-selection-queries';
import { getUserWorkspaceRoles } from '@/modules/staff/data/workspace-roles';
import { getOrgAccessBlock } from '@/modules/staff/data/org-access-queries';
import { OrgSuspendedScreen } from '@/modules/staff/ui/org-suspended-screen';
import { listOrganizerOptions } from '@/modules/superadmin/data/queries';
import { listDashboardShows } from '@/modules/shows/data/queries';
import { getMyJudgeLicense, listMyAssignments } from '@/modules/judging/data/queries';
import { classifyAssignment } from '@/modules/judging/utils/classify-assignment';
import { ROLE_WORKSPACES, RIDER_WORKSPACE } from '@/shared/constants/role-workspaces';
import { ROUTES } from '@/shared/constants/routes';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // The profile is the one fetch the shell cannot do without. A failure here
  // (database or auth outage) gets a calm retry screen instead of a blank page;
  // every fetch below it degrades to an empty value instead of throwing.
  let profile: Awaited<ReturnType<typeof getStaffProfile>>;
  try {
    profile = await getStaffProfile();
  } catch (error) {
    console.error('[dashboard] could not load staff profile', error);
    return <WorkspaceUnavailable />;
  }

  if (!profile) {
    const rider = await getRiderProfile().catch(() => null);
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
        action={<SignOutButton />}
      />
    );
  }

  if (workspace.status === 'pending') {
    return (
      <PendingWorkspace
        workspace={workspace}
        roleLabel={role}
        userName={profile.name}
        action={<SignOutButton />}
      />
    );
  }

  // Every org this staff user works for is suspended or deleted: close the
  // workspace (RLS blocks the data too). SuperAdmin is never blocked.
  if (role !== 'SuperAdmin') {
    const block = await getOrgAccessBlock().catch((error: unknown) => {
      console.error('[dashboard] could not check organization status', error);
      return null;
    });
    if (block?.allBlocked) return <OrgSuspendedScreen reason={block.allBlocked} />;
  }

  const impersonating =
    role === 'SuperAdmin' ? await getImpersonatedOrgId().catch(() => null) : null;

  if (role === 'SuperAdmin' && !impersonating) {
    // Deleted and demo orgs are filtered out inside the query, for the same
    // reason they're out of the console's table. A switcher is a convenience:
    // if its list can't be loaded, the dashboard must still render, so this
    // degrades to an empty list rather than throwing out of the layout.
    const [activeRailRole, organizers] = await Promise.all([
      getRailRole()
        .then((r) => r ?? role)
        .catch(() => role),
      listOrganizerOptions().catch(() => []),
    ]);

    return (
      <SuperAdminShell profile={profile} activeRailRole={activeRailRole} organizers={organizers}>
        {children}
      </SuperAdminShell>
    );
  }

  const previewingAsShowAdmin = await getPreviewingAsShowAdmin().catch(() => false);

  // The banner names the organizer whose live data is being edited — "viewing
  // as an organizer" alone doesn't say which one, and the whole point of the
  // warning is knowing whose records a write lands on.
  const impersonatedOrgName = impersonating
    ? await getOrganizationName(impersonating).catch(() => null)
    : null;

  const railRoleCookie = impersonating ? await getRailRole().catch(() => null) : null;
  const shellRole = previewingAsShowAdmin ? 'ShowAdmin' : impersonating ? 'Organizer' : role;
  const shellWorkspace = ROLE_WORKSPACES[shellRole] ?? workspace;

  const { orgId: selectedOrgId, memberOrgs } = impersonating
    ? { orgId: null, memberOrgs: [] }
    : await getSelectedOrg().catch(() => ({ orgId: null, memberOrgs: [] }));

  // Workspaces this staff user may switch between (their platform_role + any
  // per-show staff roles). Only meaningful for genuine non-SuperAdmin staff —
  // the SuperAdmin rail already shows every role.
  const availableRoles =
    role === 'SuperAdmin' || impersonating
      ? []
      : await getUserWorkspaceRoles(profile).catch(() => []);

  // The redesign's topbar carries the focused-show picker and the sidebar's
  // Rider Entries count, both of which need the org's show list. Only the
  // Organizer/ShowAdmin workspace has them; a failed load degrades to an
  // empty picker rather than taking the whole shell down.
  const shellOrgId = impersonating ?? selectedOrgId;
  const hasShowPicker = shellRole === 'Organizer' || shellRole === 'ShowAdmin';
  // Judges and scribes get a live count on "My Assignments" and a "Live
  // today" status under the workspace name, as in the redesign.
  const sitsOnPanels =
    !impersonating &&
    (role === 'Judge' ||
      role === 'Scribe' ||
      availableRoles.includes('Judge') ||
      availableRoles.includes('Scribe'));
  const [shellShows, shellOrgName, panelAssignments, judgeLicense] = await Promise.all([
    hasShowPicker && shellOrgId ? listDashboardShows(shellOrgId).catch(() => []) : [],
    impersonatedOrgName ??
      memberOrgs.find((o) => o.orgId === selectedOrgId)?.orgName ??
      (selectedOrgId ? getOrganizationName(selectedOrgId).catch(() => null) : null),
    sitsOnPanels ? listMyAssignments().catch(() => []) : [],
    sitsOnPanels ? getMyJudgeLicense().catch(() => null) : null,
  ]);
  const panelToday = panelAssignments.filter((a) => classifyAssignment(a) === 'today').length;
  const panelUpcoming = panelAssignments.filter((a) => classifyAssignment(a) === 'upcoming').length;

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
      orgName={shellOrgName}
      shows={shellShows}
      panelSummary={
        sitsOnPanels ? { today: panelToday, upcoming: panelUpcoming, license: judgeLicense } : null
      }
    >
      {children}
    </OrganizerShell>
  );
}
