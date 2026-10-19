import type { Metadata } from 'next';
import { getOrganizerContext } from '@/modules/staff/data/context';
import { getShowPnl } from '@/modules/shows/data/setup-queries';
import type { StripeConnectStatus } from '@/modules/shows/types';
import { getOrgBilling, getStripeConnectStatus } from '@/modules/shows/data/queries';
import { formatMoneyExact } from '@/shared/lib/format/currency';
import { StatBox, StatGrid } from '@/shared/ui/organizer/fa-page';
import { WorkspacePage, EmptyPanel } from '@/modules/staff/ui/workspace-page';
import { BillingBlocks } from '@/modules/shows/ui/financial/billing-blocks';
import { PayoutArchitectureCard } from '@/modules/shows/ui/financial/payout-architecture-card';
import { PnlPanel } from '@/modules/shows/ui/financial/pnl-panel';
import { PnlPrintReport } from '@/modules/shows/ui/financial/pnl-print-report';
import { PrintPnlButton } from '@/modules/shows/ui/financial/print-pnl-button';
import { StripeConnectionCard } from '@/modules/shows/ui/financial/stripe-connection-card';

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
        description="Payouts, charges and your profit & loss"
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
        description="Payouts, charges and your profit & loss"
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

  const paidOut = billing.payouts.filter((p) => p.status === 'paid');

  return (
    <WorkspacePage
      title="Financial"
      description="Payouts, charges and your profit & loss"
      orgName={context.orgName}
      shows={context.shows}
      currentShow={context.currentShow}
      actions={pnl ? <PrintPnlButton /> : undefined}
    >
      <StripeConnectionCard connect={connect} />

      {pnl && (
        <StatGrid cols={4}>
          <StatBox
            label="Revenue"
            value={formatMoneyExact(pnl.revenueTotal)}
            tone="green"
            note="this show"
          />
          <StatBox
            label="Expenses"
            value={formatMoneyExact(pnl.expensesTotal)}
            note={`${String(pnl.expenses.length)} cost line${pnl.expenses.length === 1 ? '' : 's'}`}
          />
          <StatBox
            label="Net"
            value={formatMoneyExact(pnl.net)}
            tone={pnl.net < 0 ? 'red' : 'green'}
            note={pnl.net < 0 ? 'loss' : 'profit'}
          />
          <StatBox
            label="Paid out"
            value={formatMoneyExact(paidOut.reduce((sum, p) => sum + p.amount, 0))}
            note={`${String(paidOut.length)} payout${paidOut.length === 1 ? '' : 's'} · all shows`}
          />
        </StatGrid>
      )}

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        {pnl ? (
          <PnlPanel pnl={pnl} />
        ) : (
          <EmptyPanel title="No profit & loss yet" note="This show's figures couldn't be loaded." />
        )}
        <BillingBlocks billing={billing} />
      </div>

      <PayoutArchitectureCard />

      {pnl && <PnlPrintReport pnl={pnl} />}
    </WorkspacePage>
  );
}
