import { redirect } from 'next/navigation';
import { DashboardOverview } from '@/modules/staff/ui/dashboard-overview';
import { getOrganizerContext } from '@/modules/staff/data/context';
import {
  getShowAttention,
  getShowInventory,
  getShowStage,
  getShowStats,
} from '@/modules/shows/data/queries';
import { createServerClient } from '@/shared/lib/supabase/server';
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

  if (!context.currentShow) {
    return (
      <DashboardOverview
        orgName={context.orgName}
        shows={context.shows}
        currentShow={null}
        stats={null}
        inventory={[]}
        stage="setup"
        rings={[]}
        canViewMoney={context.canViewMoney}
      />
    );
  }

  const supabase = await createServerClient();
  const [stats, inventory, stage, attention, { data: showRow }] = await Promise.all([
    getShowStats(context.currentShow.id),
    getShowInventory(context.currentShow.id),
    getShowStage(context.currentShow.id),
    getShowAttention(context.currentShow.id),
    supabase.from('shows').select('locations').eq('id', context.currentShow.id).single(),
  ]);

  const rings = ((showRow?.locations ?? []) as { name?: string; num?: number }[])
    .map((loc) => loc.name ?? (loc.num ? `Ring ${String(loc.num)}` : null))
    .filter((name): name is string => !!name);

  return (
    <DashboardOverview
      orgName={context.orgName}
      shows={context.shows}
      currentShow={context.currentShow}
      stats={stats}
      inventory={inventory}
      stage={stage}
      rings={rings}
      attention={attention}
      canViewMoney={context.canViewMoney}
    />
  );
}
