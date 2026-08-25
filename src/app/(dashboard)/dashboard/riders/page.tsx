import type { Metadata } from 'next';
import { getOrganizerContext } from '@/modules/staff/data/context';
import { getShowRiders } from '@/modules/shows/data/setup-queries';
import { WorkspacePage, EmptyPanel } from '@/modules/staff/ui/workspace-page';
import { RidersListScreen } from '@/modules/shows/ui/lists/riders-list-screen';

export const metadata: Metadata = { title: 'Riders — Field & Arena' };

export default async function RidersPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const { show: requestedShowId } = await searchParams;
  const context = await getOrganizerContext(requestedShowId);

  if (!context.currentShow) {
    return (
      <WorkspacePage
        title="Riders"
        description="Everyone registered for a show."
        orgName={context.orgName}
        showPicker={false}
      >
        <EmptyPanel title="No shows yet" note="Create a show to see who has registered." />
      </WorkspacePage>
    );
  }

  const data = await getShowRiders(context.currentShow.id);

  return (
    <WorkspacePage
      title="Riders"
      description="Everyone registered for a show."
      orgName={context.orgName}
      shows={context.shows}
      currentShow={context.currentShow}
    >
      {data ? (
        <RidersListScreen data={data} canViewMoney={context.canViewMoney} />
      ) : (
        <EmptyPanel title="Show not found" note="This show doesn't exist, or you can't see it." />
      )}
    </WorkspacePage>
  );
}
