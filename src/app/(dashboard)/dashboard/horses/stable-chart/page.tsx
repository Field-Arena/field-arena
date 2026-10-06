import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getOrganizerContext } from '@/modules/staff/data/context';
import { getStableChartPageData } from '@/modules/shows/data/stable-chart-queries';
import { listArrivalsDepartures } from '@/modules/shows/data/arrivals-departures-queries';
import { StableChartScreen } from '@/modules/shows/ui/stable-chart/stable-chart-screen';
import { EmptyPanel } from '@/shared/ui/workspace-page';

export const metadata: Metadata = { title: 'Stable Chart — Field & Arena' };

export default async function StableChartPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const { show: requestedShowId } = await searchParams;
  const context = await getOrganizerContext(requestedShowId);

  if (!context.currentShow) {
    return (
      <div className="text-ink-deep font-[family-name:var(--font-ar)]">
        <EmptyPanel title="No shows yet" note="The stable chart is per show." />
      </div>
    );
  }

  const [chartData, arrivals] = await Promise.all([
    getStableChartPageData(context.currentShow.id),
    listArrivalsDepartures(context.currentShow.id),
  ]);

  if (!chartData) notFound();

  return (
    <div className="text-ink-deep font-[family-name:var(--font-ar)]">
      <StableChartScreen
        data={chartData}
        arrivals={arrivals}
        showEndDate={context.currentShow.endDate}
        publicId={context.currentShow.slug ?? context.currentShow.id}
      />
    </div>
  );
}
