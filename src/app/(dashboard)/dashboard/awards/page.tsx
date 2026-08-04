import type { Metadata } from 'next';
import { getOrganizerContext } from '@/modules/staff/data/context';
import { getShowAwards } from '@/modules/shows/data/setup-queries';
import { EmptyPanel } from '@/modules/staff/ui/workspace-page';
import { AwardsScreen } from '@/modules/shows/ui/awards/awards-screen';

export const metadata: Metadata = { title: 'Awards — Field & Arena' };

/**
 * Awards — reached from the Dashboard's own Awards button.
 *
 * A dedicated full screen, not wrapped in the shared `WorkspacePage`/stat-row
 * chrome the way Horses or Show Manager are — the design's own Awards overlay
 * carries just its own title, toolbar and "Back to Dashboard", no lifecycle
 * stepper, so `AwardsScreen` owns its whole header rather than sharing one.
 *
 * Only the discipline filter is a URL parameter. By Test / By Division is not:
 * it is a show-wide setting stored with the schedule preferences, so this page
 * and Master Schedule can never disagree about how the show awards.
 */
export default async function AwardsPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string; discipline?: string }>;
}) {
  const { show: requestedShowId, discipline } = await searchParams;
  const context = await getOrganizerContext(requestedShowId);

  if (!context.currentShow) {
    return (
      <div className="font-[family-name:var(--font-ar)] text-ink-deep">
        <EmptyPanel title="No shows yet" note="Create a show to see its standings." />
      </div>
    );
  }

  const filter = discipline ?? 'all';
  const awards = await getShowAwards(context.currentShow.id, filter);

  if (!awards) {
    return (
      <div className="font-[family-name:var(--font-ar)] text-ink-deep">
        <EmptyPanel title="Show not found" note="This show doesn't exist, or you can't see it." />
      </div>
    );
  }

  return <AwardsScreen awards={awards} shows={context.shows} discipline={filter} />;
}
