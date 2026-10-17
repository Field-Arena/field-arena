import { redirect } from 'next/navigation';
import { DashboardOverview } from '@/modules/staff/ui/dashboard-overview';
import { DashboardHome } from '@/modules/staff/ui/dashboard-home';
import { getOrganizerContext } from '@/modules/staff/data/context';
import {
  getShowInventory,
  getShowStage,
  getShowStats,
  listShowsForPicker,
} from '@/modules/shows/data/queries';
import { getShowTodos } from '@/modules/shows/data/dashboard-todos';
import { createServerClient } from '@/shared/lib/supabase/server';
import { todayIsoInZone } from '@/modules/staff/utils';
import { daysUntilShow, pickCurrentShows } from '@/modules/shows/utils/current-shows';
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
        const [{ todos, documents }, stats] = await Promise.all([
          getShowTodos(show, daysOut),
          getShowStats(show.id).catch(() => null),
        ]);
        return { show, daysOut, entries: stats?.entries ?? null, todos, documents };
      }),
    );
    return <DashboardHome orgName={context.orgName} shows={homeShows} />;
  }

  const currentShow = context.currentShow;
  const daysOut = daysUntilShow(currentShow, today);
  const supabase = await createServerClient();
  const [stats, inventory, stage, { todos, documents }, { data: showRow }] = await Promise.all([
    getShowStats(currentShow.id),
    getShowInventory(currentShow.id),
    getShowStage(currentShow.id),
    getShowTodos(currentShow, daysOut),
    supabase.from('shows').select('locations').eq('id', currentShow.id).single(),
  ]);

  const rings = ((showRow?.locations ?? []) as { name?: string; num?: number }[])
    .map((loc) => loc.name ?? (loc.num ? `Ring ${String(loc.num)}` : null))
    .filter((name): name is string => !!name);

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
