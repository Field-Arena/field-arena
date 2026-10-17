import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getOrganizerContext } from '@/modules/staff/data/context';
import { getStableChartPageData } from '@/modules/shows/data/stable-chart-queries';
import { listArrivalsDepartures } from '@/modules/shows/data/arrivals-departures-queries';
import { StableChartScreen } from '@/modules/shows/ui/stable-chart/stable-chart-screen';
import { EmptyPanel } from '@/modules/staff/ui/workspace-page';

export const metadata: Metadata = { title: 'Stable Chart — Field & Arena' };

export default async function StableChartPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string; from?: string }>;
}) {
  const { show: requestedShowId, from } = await searchParams;
  const context = await getOrganizerContext(requestedShowId);

  if (!context.currentShow) {
    return (
      <div className="text-ink-deep font-[family-name:var(--font-ar)]">
        <EmptyPanel title="No shows yet" note="The stable chart is per show." />
      </div>
    );
  }

  // Put the show in the address so the show tabs above mark the one open.
  if (!requestedShowId) {
    const fromParam = from ? `&from=${encodeURIComponent(from)}` : '';
    redirect(
      `/dashboard/horses/stable-chart?show=${context.currentShow.slug ?? context.currentShow.id}${fromParam}`,
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
        from={from === 'horses' || from === 'setup' ? from : null}
      />
    </div>
  );
}
