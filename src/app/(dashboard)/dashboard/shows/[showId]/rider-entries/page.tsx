import type { Metadata } from 'next';
import { getRiderEntriesData } from '@/modules/shows/data/setup-queries';
import { ShowManagerShell } from '@/modules/shows/ui/show-manager/show-manager-shell';
import { RiderEntriesPanel } from '@/modules/shows/ui/show-manager/rider-entries-panel';
import { EmptyPanel } from '@/modules/staff/ui/workspace-page';
import { isUuid } from '@/shared/lib/utils';
import { getOrganizerContext } from '@/modules/staff/data/context';
import { getShowManagerVitals } from '@/modules/shows/data/queries';

export const metadata: Metadata = { title: 'Rider Entries — Field & Arena' };

/**
 * Show Manager, Rider Entries tab.
 *
 * What a rider can buy alongside an entry — branding, add-ons, vendor spaces
 * and map, qualifications. Not a list of entries, despite the tab's name; see
 * RiderEntriesPanel.
 */
export default async function RiderEntriesPage({
  params,
}: {
  params: Promise<{ showId: string }>;
}) {
  const { showId } = await params;
  const data = isUuid(showId) ? await getRiderEntriesData(showId) : null;

  if (!data) {
    return (
      <EmptyPanel
        title="Show not found"
        note="This show doesn't exist, or you don't have access to it."
      />
    );
  }

  const [context, vitals] = await Promise.all([
    getOrganizerContext(data.showId),
    getShowManagerVitals(data.showId),
  ]);

  return (
    <ShowManagerShell
      showId={data.showId}
      showName={data.showName}
      activeTab="Rider Entries"
      orgName={context.orgName}
      shows={context.shows}
      stats={vitals.stats}
      stage={vitals.stage}
      canViewMoney={context.canViewMoney}
    >
      <RiderEntriesPanel data={data} />
    </ShowManagerShell>
  );
}
