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
        description="Rider entries and add-ons"
        orgName={context.orgName}
        showPicker={false}
      >
        <EmptyPanel title="No shows yet" note="Sales are tracked per show." />
      </WorkspacePage>
    );
  }

  const isOrganizerOrImpersonating =
    context.profile.platform_role === 'Organizer' || context.impersonating;

  const canRefund = await getCanRefund(context.currentShow.id, isOrganizerOrImpersonating);
  // Without canViewMoney the rows come back with every money figure zeroed,
  // so nothing the UI hides is ever shipped to the browser.
  const rows = await listSales(context.currentShow.id, {
    canViewMoney: context.canViewMoney,
    canRefund,
  });
  const stats = computeSalesStats(rows);

  return (
    <EventSalesScreen
      shows={context.shows}
      currentRef={context.currentShow.slug ?? context.currentShow.id}
      showId={context.currentShow.id}
      showName={context.currentShow.name}
      isLive={isStripeLive()}
      canRefund={canRefund}
      canViewMoney={context.canViewMoney}
      rows={rows}
      stats={stats}
    />
  );
}
