import type { Metadata } from 'next';
import { getSelectEventsData } from '@/modules/shows/data/setup-queries';
import { ShowManagerShell } from '@/modules/shows/ui/show-manager/show-manager-shell';
import { TicketWindowCard } from '@/modules/shows/ui/show-manager/ticket-window-card';
import { SelectEventsPicker } from '@/modules/shows/ui/show-manager/select-events-picker';
import { SelectedClassesCard } from '@/modules/shows/ui/show-manager/selected-classes-card';
import { EmptyPanel } from '@/modules/staff/ui/workspace-page';
import { isUuid } from '@/shared/lib/utils';
import { getOrganizerContext } from '@/modules/staff/data/context';
import { getShowManagerVitals } from '@/modules/shows/data/queries';

export const metadata: Metadata = { title: 'Select Events — Field & Arena' };

/**
 * Show Manager, Select Events tab: /dashboard/shows/[showId]/select-events.
 *
 * Three cards in the design's order — the ticket sales window, the catalog
 * picker, then what the picker has produced. Like the Setup tab this reads the
 * show directly rather than through getOrganizerContext, so an id the caller
 * cannot see renders not-found instead of silently falling back to their first
 * show.
 */
export default async function SelectEventsPage({
  params,
}: {
  params: Promise<{ showId: string }>;
}) {
  const { showId } = await params;
  const data = isUuid(showId) ? await getSelectEventsData(showId) : null;

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
      activeTab="Select Events"
      orgName={context.orgName}
      shows={context.shows}
      stats={vitals.stats}
      stage={vitals.stage}
      canViewMoney={context.canViewMoney}
    >
      <TicketWindowCard data={data} />
      <SelectEventsPicker data={data} />
      <SelectedClassesCard data={data} />
    </ShowManagerShell>
  );
}
