import { redirect } from 'next/navigation';
import { DashboardOverview } from '@/modules/staff/ui/dashboard-overview';
import { DashboardHome } from '@/modules/staff/ui/dashboard-home';
import { getOrganizerContext } from '@/modules/staff/data/context';
import {
  getDashboardReadiness,
  getShowActivity,
  getShowInventory,
  getShowRingNames,
  getShowStage,
  getShowStats,
  listDashboardShows,
} from '@/modules/shows/data/queries';
import { getShowTodos } from '@/modules/shows/data/dashboard-todos';
import { earliestTodayIso } from '@/modules/shows/utils/today-iso';
import { daysUntilShow, pickCurrentShows } from '@/modules/shows/utils/current-shows';
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
  // The server runs in UTC and doesn't know the organizer's zone; the
  // earliest "today" anywhere keeps a show that's today for them current.
  const today = earliestTodayIso();

  // No show picked: the home view — the current shows and their to-dos.
  if (!requestedShowId || !context.currentShow) {
    const current = pickCurrentShows(dashboardShows, today);
    const homeShows = await Promise.all(
      current.map(async (show) => {
        const daysOut = daysUntilShow(show, today);
        const { todos, documents } = await getShowTodos(show, daysOut);
        return { show, daysOut, todos, documents };
      }),
    );
    return <DashboardHome orgName={context.orgName} shows={homeShows} />;
  }

  const currentShow = context.currentShow;
  const daysOut = daysUntilShow(currentShow, today);
  const [stats, inventory, stage, readiness, activity, rings, { todos, documents }] =
    await Promise.all([
      getShowStats(currentShow.id),
      getShowInventory(currentShow.id),
      getShowStage(currentShow.id),
      getDashboardReadiness(currentShow.id),
      getShowActivity(currentShow.id),
      getShowRingNames(currentShow.id),
      getShowTodos(currentShow, daysOut),
    ]);

  return (
    <DashboardOverview
      orgName={context.orgName}
      dashboardShows={dashboardShows}
      currentShow={currentShow}
      stats={stats}
      inventory={inventory}
      stage={stage}
      readiness={readiness}
      rings={rings}
      todos={todos}
      documents={documents}
      activity={activity}
      canViewMoney={context.canViewMoney}
    />
  );
}
