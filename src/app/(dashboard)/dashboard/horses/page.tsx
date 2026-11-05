import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getOrganizerContext } from '@/modules/staff/data/context';
import { getHorsesPageData } from '@/modules/shows/data/horses-queries';
import {
  normalizeStableChart,
  summarizeStableChart,
} from '@/modules/shows/data/stable-chart-queries';
import { getShowStableChartRaw } from '@/modules/shows/data/queries';
import { HorsesScreen } from '@/modules/shows/ui/horses/horses-screen';
import { EmptyPanel } from '@/modules/staff/ui/workspace-page';

export const metadata: Metadata = { title: 'Horses — Field & Arena' };

export default async function HorsesPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const { show: requestedShowId } = await searchParams;
  const context = await getOrganizerContext(requestedShowId);

  if (!context.currentShow) {
    return (
      <div className="text-ink-deep font-[family-name:var(--font-ar)]">
        <EmptyPanel title="No shows yet" note="Horses are listed per show." />
      </div>
    );
  }

  // Put the show in the address so the show tabs above mark the one open.
  if (!requestedShowId) {
    redirect(`/dashboard/horses?show=${context.currentShow.slug ?? context.currentShow.id}`);
  }

  const [stableChartRaw, horsesData] = await Promise.all([
    getShowStableChartRaw(context.currentShow.id),
    getHorsesPageData(context.currentShow.id),
  ]);

  if (!horsesData) {
    return (
      <div className="text-ink-deep font-[family-name:var(--font-ar)]">
        <EmptyPanel title="Show not found" note="This show may have been removed." />
      </div>
    );
  }

  const stableChartSummary = summarizeStableChart(normalizeStableChart(stableChartRaw));

  return (
    <div className="text-ink-deep font-[family-name:var(--font-ar)]">
      <HorsesScreen
        data={horsesData}
        stableChartSummary={stableChartSummary}
        publicId={context.currentShow.slug ?? context.currentShow.id}
      />
    </div>
  );
}
