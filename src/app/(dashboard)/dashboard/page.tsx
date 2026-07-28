import { redirect } from 'next/navigation';
import { DashboardOverview } from '@/modules/staff/ui/dashboard-overview';
import { getStaffProfile } from '@/modules/auth/data/queries';
import {
  getShowInventory,
  getShowStage,
  getShowStats,
  listShowsForOrg,
} from '@/modules/shows/data/queries';
import { createServerClient } from '@/shared/lib/supabase/server';
import { ROLE_WORKSPACES } from '@/shared/constants/role-workspaces';

/**
 * The organizer overview, and the generic landing path middleware and the login
 * form redirect to. A role with its own workspace is forwarded there rather than
 * shown the organizer view inside another shell.
 */
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const profile = await getStaffProfile();
  const role = profile?.platform_role;

  if (role && role !== 'Organizer' && role !== 'ShowAdmin') {
    const workspace = ROLE_WORKSPACES[role];
    if (workspace && workspace.href !== '/dashboard') {
      redirect(workspace.href);
    }
  }

  if (!profile) redirect('/login');

  /**
   * An Organizer is org-scoped and always has org_id set. A ShowAdmin does not —
   * their authority comes from a staff_assignments row for one specific show, so
   * their organization is resolved through that assignment rather than a column.
   * Treating ShowAdmin as org-scoped is the authorization bug the legacy code
   * called out by name.
   */
  let orgId = profile.org_id;
  if (!orgId) {
    const supabase = await createServerClient();
    const { data: assignment } = await supabase
      .from('staff_assignments')
      .select('shows(org_id)')
      .eq('user_id', profile.id)
      .limit(1)
      .maybeSingle();
    orgId =
      (assignment as { shows?: { org_id: string } | null } | null)?.shows?.org_id ?? null;
  }

  if (!orgId) {
    return (
      <DashboardOverview
        orgName="No organization"
        shows={[]}
        currentShow={null}
        stats={null}
        inventory={[]}
        stage="setup"
        rings={[]}
        canViewMoney={false}
      />
    );
  }

  const supabase = await createServerClient();
  const [{ data: org }, shows] = await Promise.all([
    supabase.from('organizations').select('name').eq('id', orgId).single(),
    listShowsForOrg(orgId),
  ]);

  const { show: requestedShowId } = await searchParams;
  const currentShow = shows.find((s) => s.id === requestedShowId) ?? shows[0] ?? null;

  if (!currentShow) {
    return (
      <DashboardOverview
        orgName={org?.name ?? 'Your organization'}
        shows={[]}
        currentShow={null}
        stats={null}
        inventory={[]}
        stage="setup"
        rings={[]}
        canViewMoney={role === 'Organizer'}
      />
    );
  }

  const [stats, inventory, stage, { data: showRow }] = await Promise.all([
    getShowStats(currentShow.id),
    getShowInventory(currentShow.id),
    getShowStage(currentShow.id),
    supabase.from('shows').select('locations').eq('id', currentShow.id).single(),
  ]);

  const rings = ((showRow?.locations ?? []) as { name?: string; num?: number }[])
    .map((loc) => loc.name ?? (loc.num ? `Ring ${String(loc.num)}` : null))
    .filter((name): name is string => !!name);

  /**
   * The Organizer is the account owner and always sees money. A ShowAdmin does
   * not by default — canViewMoney is false for every staff role until granted
   * per person, which is why this asks the database rather than assuming.
   */
  let canViewMoney = role === 'Organizer';
  if (!canViewMoney) {
    const { data: allowed } = await supabase.rpc('has_show_permission', {
      target_show_id: currentShow.id,
      permission_key: 'canViewMoney',
    });
    canViewMoney = allowed === true;
  }

  return (
    <DashboardOverview
      orgName={org?.name ?? 'Your organization'}
      shows={shows}
      currentShow={currentShow}
      stats={stats}
      inventory={inventory}
      stage={stage}
      rings={rings}
      canViewMoney={canViewMoney}
    />
  );
}
