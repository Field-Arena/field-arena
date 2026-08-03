import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getOrganizerContext } from '@/modules/staff/data/context';
import { getStableChartPageData } from '@/modules/shows/data/stable-chart-queries';
import { getShowManagerVitals } from '@/modules/shows/data/queries';
import { createServerClient } from '@/shared/lib/supabase/server';
import { WorkspaceHeader } from '@/shared/ui/organizer/workspace-header';
import { StableChartScreen } from '@/modules/shows/ui/stable-chart/stable-chart-screen';
import { EmptyPanel } from '@/modules/staff/ui/workspace-page';
import { NewShowButton } from '@/modules/shows/ui/show-manager/new-show-button';

export const metadata: Metadata = { title: 'Stable Chart — Field & Arena' };

/**
 * "Stable Chart" — a sub-route of Horses (reached from, and returns to, the
 * Horses screen — see horses-screen.tsx's "🏠 Stable Chart" button), matching
 * legacy's showStableChart() (~14042). `?show=` and the WorkspaceHeader
 * chrome are wired exactly like horses/page.tsx.
 */
export default async function StableChartPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const { show: requestedShowId } = await searchParams;
  const context = await getOrganizerContext(requestedShowId);

  if (!context.currentShow) {
    return (
      <div className="font-[family-name:var(--font-ar)] text-ink-deep">
        <EmptyPanel title="No shows yet" note="The stable chart is per show." />
      </div>
    );
  }

  const supabase = await createServerClient();
  const [{ stats, stage }, showRow, chartData] = await Promise.all([
    getShowManagerVitals(context.currentShow.id),
    supabase.from('shows').select('locations').eq('id', context.currentShow.id).single(),
    getStableChartPageData(context.currentShow.id),
  ]);

  if (!chartData) notFound();

  const rings = ((showRow.data?.locations ?? []) as { name?: string; num?: number }[])
    .map((loc) => loc.name ?? (loc.num ? `Ring ${String(loc.num)}` : null))
    .filter((name): name is string => !!name);

  return (
    <div className="font-[family-name:var(--font-ar)] text-ink-deep">
      <WorkspaceHeader
        orgName={context.orgName}
        shows={context.shows}
        currentShow={context.currentShow}
        stage={stage}
        stats={stats}
        canViewMoney={context.canViewMoney}
        rings={rings}
        newShowSlot={<NewShowButton className="px-[15px] py-2.5 text-[13px]" />}
      />

      <StableChartScreen data={chartData} />
    </div>
  );
}
