import type { Metadata } from 'next';
import { getOrganizerContext } from '@/modules/staff/data/context';
import { getShowEntries } from '@/modules/shows/data/setup-queries';
import { WorkspacePage, EmptyPanel } from '@/modules/staff/ui/workspace-page';
import { EntriesListScreen } from '@/modules/shows/ui/lists/entries-list-screen';

export const metadata: Metadata = { title: 'Entries — Field & Arena' };

/** Every class entry sold for the focused show — the Dashboard's "Entries sold" card. */
export default async function EntriesPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const { show: requestedShowId } = await searchParams;
  const context = await getOrganizerContext(requestedShowId);

  if (!context.currentShow) {
    return (
      <WorkspacePage
        title="Entries"
        description="Every class entry sold, grouped by class."
        orgName={context.orgName}
        showPicker={false}
      >
        <EmptyPanel title="No shows yet" note="Create a show to see its entries." />
      </WorkspacePage>
    );
  }

  const data = await getShowEntries(context.currentShow.id);

  return (
    <WorkspacePage
      title="Entries"
      description="Every class entry sold, grouped by class."
      orgName={context.orgName}
      shows={context.shows}
      currentShow={context.currentShow}
    >
      {data ? (
        <EntriesListScreen data={data} canViewMoney={context.canViewMoney} />
      ) : (
        <EmptyPanel title="Show not found" note="This show doesn't exist, or you can't see it." />
      )}
    </WorkspacePage>
  );
}
