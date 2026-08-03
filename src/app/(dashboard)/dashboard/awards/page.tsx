import type { Metadata } from 'next';
import { getOrganizerContext } from '@/modules/staff/data/context';
import { getShowAwards } from '@/modules/shows/data/setup-queries';
import { WorkspacePage, EmptyPanel } from '@/modules/staff/ui/workspace-page';
import { AwardsScreen } from '@/modules/shows/ui/awards/awards-screen';

export const metadata: Metadata = { title: 'Awards — Field & Arena' };

/**
 * Awards — reached from the Dashboard's own Awards button.
 *
 * Grouping defaults to whatever the show's schedule preferences say, so the
 * choice made on Master Schedule's awards toggle is the one this opens with
 * rather than a separate setting that could disagree with it.
 */
export default async function AwardsPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string; grouping?: string; discipline?: string }>;
}) {
  const { show: requestedShowId, grouping, discipline } = await searchParams;
  const context = await getOrganizerContext(requestedShowId);

  if (!context.currentShow) {
    return (
      <WorkspacePage
        title="Awards"
        description="Standings and ribbon placings, by class and discipline."
        orgName={context.orgName}
        showPicker={false}
      >
        <EmptyPanel title="No shows yet" note="Create a show to see its standings." />
      </WorkspacePage>
    );
  }

  const mode = grouping === 'division' ? 'division' : 'test';
  const filter = discipline ?? 'All disciplines';
  const awards = await getShowAwards(context.currentShow.id, mode, filter);

  return (
    <WorkspacePage
      title="Awards"
      description="Standings and ribbon placings, by class and discipline."
      orgName={context.orgName}
      shows={context.shows}
      currentShow={context.currentShow}
    >
      {awards ? (
        <AwardsScreen awards={awards} grouping={mode} discipline={filter} />
      ) : (
        <EmptyPanel title="Show not found" note="This show doesn't exist, or you can't see it." />
      )}
    </WorkspacePage>
  );
}
