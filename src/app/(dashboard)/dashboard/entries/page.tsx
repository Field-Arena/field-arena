import type { Metadata } from 'next';
import { getOrganizerContext } from '@/modules/staff/data/context';
import { getShowEntries, getShowRiders } from '@/modules/shows/data/setup-queries';
import { WorkspacePage, EmptyPanel } from '@/shared/ui/workspace-page';
import { RiderEntriesScreen } from '@/modules/shows/ui/lists/rider-entries-screen';
import { env } from '@/shared/lib/env';

export const metadata: Metadata = { title: 'Rider Entries — Field & Arena' };

const DESCRIPTION =
  'Every rider entered in the focused show — horses, class entries, and where their payment stands.';

export default async function EntriesPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const { show: requestedShowId } = await searchParams;
  const context = await getOrganizerContext(requestedShowId);

  if (!context.currentShow) {
    return (
      <WorkspacePage title="Rider Entries" description={DESCRIPTION} orgName={context.orgName}>
        <EmptyPanel title="No shows yet" note="Create a show to see its entries." />
      </WorkspacePage>
    );
  }

  const [riders, entries] = await Promise.all([
    getShowRiders(context.currentShow.id),
    getShowEntries(context.currentShow.id),
  ]);
  const ref = context.currentShow.slug ?? context.currentShow.id;

  return (
    <WorkspacePage title="Rider Entries" description={DESCRIPTION} orgName={context.orgName}>
      {riders && entries ? (
        <RiderEntriesScreen
          riders={riders}
          entries={entries}
          canViewMoney={context.canViewMoney}
          publicUrl={`${env.siteUrl}/show/${ref}`}
        />
      ) : (
        <EmptyPanel title="Show not found" note="This show doesn't exist, or you can't see it." />
      )}
    </WorkspacePage>
  );
}
