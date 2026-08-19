import type { Metadata } from 'next';
import { getOrganizerContext } from '@/modules/staff/data/context';
import { getShowPnl } from '@/modules/shows/data/setup-queries';
import type { StripeConnectStatus } from '@/modules/shows/data/queries';
import { getOrgBilling, getStripeConnectStatus } from '@/modules/shows/data/queries';
import { WorkspacePage, EmptyPanel } from '@/modules/staff/ui/workspace-page';
import { BillingBlocks } from '@/modules/shows/ui/financial/billing-blocks';
import { PnlPanel } from '@/modules/shows/ui/financial/pnl-panel';
import { PnlPrintReport } from '@/modules/shows/ui/financial/pnl-print-report';

export const metadata: Metadata = { title: 'Financial — Field & Arena' };

const NO_ORG_CONNECT: StripeConnectStatus = {
  configured: false,
  connected: false,
  accountId: null,
  status: 'not_started',
  chargesEnabled: false,
  payoutsEnabled: false,
  requirementsDue: [],
};

export default async function FinancialPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const { show: requestedShowId } = await searchParams;
  const context = await getOrganizerContext(requestedShowId);

  if (!context.currentShow) {
    return (
      <WorkspacePage
        title="Financial"
        description="Invoices, payouts, and financial reporting."
        orgName={context.orgName}
        showPicker={false}
      >
        <EmptyPanel title="No shows yet" note="Create a show to see its revenue and expenses." />
      </WorkspacePage>
    );
  }

  if (!context.canViewMoney) {
    return (
      <WorkspacePage
        title="Financial"
        description="Invoices, payouts, and financial reporting."
        orgName={context.orgName}
        shows={context.shows}
        currentShow={context.currentShow}
      >
        <EmptyPanel
          title="Not available for your role"
          note="Financial figures are shown only to staff granted money access on this show."
        />
      </WorkspacePage>
    );
  }

  const [pnl, connect, billing] = await Promise.all([
    getShowPnl(context.currentShow.id),
    context.orgId ? getStripeConnectStatus(context.orgId) : Promise.resolve(NO_ORG_CONNECT),

    context.orgId ? getOrgBilling(context.orgId) : Promise.resolve({ charges: [], payouts: [] }),
  ]);

  return (
    <WorkspacePage
      title="Financial"
      description="Invoices, payouts, and financial reporting."
      orgName={context.orgName}
      shows={context.shows}
      currentShow={context.currentShow}
    >
      <div className="flex flex-col gap-4">
        <BillingBlocks connect={connect} billing={billing} />
        {pnl && <PnlPanel pnl={pnl} canViewMoney={context.canViewMoney} />}
      </div>

      {pnl && <PnlPrintReport pnl={pnl} />}
    </WorkspacePage>
  );
}
