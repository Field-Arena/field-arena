import type { Metadata } from 'next';
import { getOrganizerContext } from '@/modules/staff/data/context';
import { getShowAwards } from '@/modules/shows/data/setup-queries';
import { EmptyPanel } from '@/modules/staff/ui/workspace-page';
import { AwardsScreen } from '@/modules/shows/ui/awards/awards-screen';

export const metadata: Metadata = { title: 'Awards — Field & Arena' };

export default async function AwardsPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string; discipline?: string }>;
}) {
  const { show: requestedShowId, discipline } = await searchParams;
  const context = await getOrganizerContext(requestedShowId);

  if (!context.currentShow) {
    return (
      <div className="text-ink-deep font-[family-name:var(--font-ar)]">
        <EmptyPanel title="No shows yet" note="Create a show to see its standings." />
      </div>
    );
  }

  const filter = discipline ?? 'all';
  const awards = await getShowAwards(context.currentShow.id, filter);

  if (!awards) {
    return (
      <div className="text-ink-deep font-[family-name:var(--font-ar)]">
        <EmptyPanel title="Show not found" note="This show doesn't exist, or you can't see it." />
      </div>
    );
  }

  return <AwardsScreen awards={awards} shows={context.shows} discipline={filter} />;
}
