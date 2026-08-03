import type { Metadata } from 'next';
import { getOrganizerContext } from '@/modules/staff/data/context';
import { getShowPnl } from '@/modules/shows/data/setup-queries';
import { getOrgStripeAccountId } from '@/modules/shows/data/queries';
import { WorkspacePage, EmptyPanel } from '@/modules/staff/ui/workspace-page';
import { BillingBlocks } from '@/modules/shows/ui/financial/billing-blocks';
import { PnlPanel } from '@/modules/shows/ui/financial/pnl-panel';
import { PnlPrintReport } from '@/modules/shows/ui/financial/pnl-print-report';

export const metadata: Metadata = { title: 'Financial — Field & Arena' };

/**
 * The Financial tab, ported from showstaff.html's renderBilling.
 *
 * Scoped to the focused show, not rolled up across the organization — the
 * legacy view reads the same show-select every other per-show Billing and
 * ShowRunner view uses, and a P&L that mixed three shows together would answer
 * nobody's question.
 *
 * Money is gated on canViewMoney rather than on role: it is granted per person,
 * and a ShowAdmin without it sees the show but not its numbers.
 */
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
        description="Revenue, expenses and payouts for a show."
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
        description="Revenue, expenses and payouts for a show."
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

  const [pnl, stripeAccountId] = await Promise.all([
    getShowPnl(context.currentShow.id),
    context.orgId ? getOrgStripeAccountId(context.orgId) : Promise.resolve(null),
  ]);

  return (
    <WorkspacePage
      title="Financial"
      description="Revenue, expenses and payouts for a show."
      orgName={context.orgName}
      shows={context.shows}
      currentShow={context.currentShow}
    >
      {/* Screen and print are two different documents here — see the
          @media print block in dashboard.css, which hides the workspace and
          leaves only [data-print-report] standing. */}
      <div className="flex flex-col gap-4">
        <BillingBlocks stripeAccountId={stripeAccountId} />
        {pnl && <PnlPanel pnl={pnl} canViewMoney={context.canViewMoney} />}
      </div>

      {pnl && <PnlPrintReport pnl={pnl} />}
    </WorkspacePage>
  );
}
