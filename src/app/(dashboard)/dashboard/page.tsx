import { redirect } from 'next/navigation';
import { DashboardOverview } from '@/modules/staff/ui/dashboard-overview';
import { DashboardHome } from '@/modules/staff/ui/dashboard-home';
import { getOrganizerContext } from '@/modules/staff/data/context';
import {
  getShowInventory,
  getShowRingNames,
  getShowStage,
  getShowStats,
  listShowsForPicker,
} from '@/modules/shows/data/queries';
import { getShowTodos } from '@/modules/shows/data/dashboard-todos';
import { todayIsoInZone } from '@/modules/staff/utils';
import {
  daysUntilShow,
  pickCurrentShows,
  pickFinishedShows,
} from '@/modules/shows/utils/current-shows';
import { toDashboardShowRows } from '@/modules/shows/utils/dashboard-show-rows';
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

  const dashboardShows = context.orgId
    ? toDashboardShowRows(await listShowsForPicker(context.orgId))
    : [];
  const today = todayIsoInZone();

  // No show picked: the home view — the current shows and their to-dos.
  if (!requestedShowId || !context.currentShow) {
    const current = pickCurrentShows(dashboardShows, today);
    const homeShows = await Promise.all(
      current.map(async (show) => {
        const daysOut = daysUntilShow(show, today);
        const { todos, documents, entries, revenue, tickets, detail } = await getShowTodos(
          show,
          daysOut,
        );
        return { show, daysOut, entries, revenue, tickets, todos, documents, detail };
      }),
    );
    return (
      <DashboardHome
        orgName={context.orgName}
        shows={homeShows}
        upcomingShows={pickCurrentShows(dashboardShows, today, Infinity)}
        finishedShows={pickFinishedShows(dashboardShows, today)}
        canViewMoney={context.canViewMoney}
      />
    );
  }

  const currentShow = context.currentShow;
  const daysOut = daysUntilShow(currentShow, today);
  const [stats, inventory, stage, { todos, documents }, rings] = await Promise.all([
    getShowStats(currentShow.id),
    getShowInventory(currentShow.id),
    getShowStage(currentShow.id),
    getShowTodos(currentShow, daysOut),
    getShowRingNames(currentShow.id),
  ]);

  return (
    <DashboardOverview
      orgName={context.orgName}
      shows={context.shows}
      currentShow={currentShow}
      stats={stats}
      inventory={inventory}
      stage={stage}
      rings={rings}
      todos={todos}
      documents={documents}
      daysOut={daysOut}
      canViewMoney={context.canViewMoney}
    />
  );
}
