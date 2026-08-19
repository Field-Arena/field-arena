import type { Metadata } from 'next';
import { getOrganizerContext } from '@/modules/staff/data/context';
import { listSales, getCanRefund } from '@/modules/sales/data/queries';
import { computeSalesStats } from '@/modules/sales/utils/compute-sales-stats';
import { EventSalesScreen } from '@/modules/sales/ui/event-sales-screen';
import { isStripeLive } from '@/shared/lib/stripe';
import { WorkspacePage, EmptyPanel } from '@/modules/staff/ui/workspace-page';

export const metadata: Metadata = { title: 'Event Sales — Field & Arena' };

export default async function EventSalesPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const { show: requestedShowId } = await searchParams;
  const context = await getOrganizerContext(requestedShowId);

  if (!context.currentShow) {
    return (
      <WorkspacePage
        title="Event Sales"
        description="Rider entries and add-ons."
        orgName={context.orgName}
        showPicker={false}
      >
        <EmptyPanel title="No shows yet" note="Sales are tracked per show." />
      </WorkspacePage>
    );
  }

  const isOrganizerOrImpersonating =
    context.profile.platform_role === 'Organizer' || context.impersonating;

  const [rows, canRefund] = await Promise.all([
    listSales(context.currentShow.id),
    getCanRefund(context.currentShow.id, isOrganizerOrImpersonating),
  ]);
  const stats = computeSalesStats(rows);

  return (
    <WorkspacePage
      title="Event Sales"
      description="Rider entries and add-ons."
      orgName={context.orgName}
      shows={context.shows}
      currentShow={context.currentShow}
    >
      <EventSalesScreen
        showId={context.currentShow.id}
        showName={context.currentShow.name}
        isLive={isStripeLive()}
        canRefund={canRefund}
        rows={rows}
        stats={stats}
      />
    </WorkspacePage>
  );
}
