import { redirect } from 'next/navigation';
import { DashboardOverview } from '@/modules/staff/ui/dashboard-overview';
import { getOrganizerContext } from '@/modules/staff/data/context';
import {
  getDashboardReadiness,
  getShowActivity,
  getShowAttention,
  getShowInventory,
  getShowRingNames,
  getShowStage,
  getShowStats,
  listDashboardShows,
} from '@/modules/shows/data/queries';
import { ROLE_WORKSPACES } from '@/shared/constants/role-workspaces';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const { show: requestedShowId } = await searchParams;
  const context = await getOrganizerContext(requestedShowId);
  const role = context.profile.platform_role;

  if (!context.impersonating && role && role !== 'Organizer' && role !== 'ShowAdmin') {
    const workspace = ROLE_WORKSPACES[role];
    if (workspace && workspace.href !== '/dashboard') {
      redirect(workspace.href);
    }
  }

  const dashboardShows = context.orgId ? await listDashboardShows(context.orgId) : [];

  if (!context.currentShow) {
    return (
      <DashboardOverview
        orgName={context.orgName}
        shows={context.shows}
        dashboardShows={dashboardShows}
        currentShow={null}
        stats={null}
        inventory={[]}
        stage="setup"
        readiness={null}
        rings={[]}
        canViewMoney={context.canViewMoney}
      />
    );
  }

  const [stats, inventory, stage, attention, readiness, activity, rings] = await Promise.all([
    getShowStats(context.currentShow.id),
    getShowInventory(context.currentShow.id),
    getShowStage(context.currentShow.id),
    getShowAttention(context.currentShow.id),
    getDashboardReadiness(context.currentShow.id),
    getShowActivity(context.currentShow.id),
    getShowRingNames(context.currentShow.id),
  ]);

  return (
    <DashboardOverview
      orgName={context.orgName}
      shows={context.shows}
      dashboardShows={dashboardShows}
      currentShow={context.currentShow}
      stats={stats}
      inventory={inventory}
      stage={stage}
      readiness={readiness}
      rings={rings}
      attention={attention}
      activity={activity}
      canViewMoney={context.canViewMoney}
    />
  );
}
