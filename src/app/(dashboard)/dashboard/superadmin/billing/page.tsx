import type { Metadata } from 'next';
import { Clock, CreditCard, DollarSign, TriangleAlert } from 'lucide-react';
import { getBillingSummary, listOrganizationBilling } from '@/modules/superadmin/data/queries';
import { MoneyStatCards } from '@/modules/superadmin/ui/money-stat-cards';
import { BillingTable } from '@/modules/superadmin/ui/billing-table';
import { formatMoneyExact } from '@/shared/lib/format/currency';

export const metadata: Metadata = {
  title: 'Billing — SuperAdmin Console',
};

export default async function BillingPage() {
  const [summary, organizations] = await Promise.all([
    getBillingSummary(),
    listOrganizationBilling(),
  ]);

  // Anything that isn't a live, chargeable account needs attention — not just
  // the ones with no account at all (legacy counted status !== 'active').
  const needingAttention = organizations.filter((org) => org.stripeStatus !== 'active').length;
  const pendingPayouts = organizations.reduce((sum, org) => sum + org.pendingPayout, 0);

  return (
    <div className="space-y-7">
      <div className="max-w-[680px]">
        <h1 className="mb-2 font-[family-name:var(--fa-serif)] text-[29px] leading-tight font-semibold tracking-[-.5px] text-[#101828]">
          Billing
        </h1>
        <p className="text-[14.5px] leading-[1.6] text-[#475467]">
          Platform-wide Stripe Connect status and deposit reconciliation across every organizer.
          Search or pick an organizer above to reconcile their shows, review their Connect account,
          and check payout history.
        </p>
      </div>

      <MoneyStatCards
        stats={[
          {
            label: 'Platform volume',
            value: formatMoneyExact(summary.grossPaid),
            icon: <DollarSign aria-hidden />,
            tone: 'emerald',
          },
          {
            label: 'Platform fees earned',
            value: formatMoneyExact(summary.platformFees),
            icon: <CreditCard aria-hidden />,
            tone: 'sky',
          },
          {
            label: 'Pending payouts',
            value: formatMoneyExact(pendingPayouts),
            icon: <Clock aria-hidden />,
            tone: 'violet',
          },
          {
            label: 'Accounts needing attention',
            value: needingAttention,
            icon: <TriangleAlert aria-hidden />,
            tone: needingAttention > 0 ? 'amber' : 'emerald',
          },
        ]}
      />

      {(summary.pendingOrders > 0 || summary.failedOrders > 0) && (
        <p className="text-[13px] text-[#475467]">
          {summary.pendingOrders} pending and {summary.failedOrders} failed{' '}
          {summary.failedOrders === 1 ? 'checkout' : 'checkouts'} are excluded from every figure
          above. Pending orders older than six hours are marked abandoned automatically.
        </p>
      )}

      <BillingTable rows={organizations} />
    </div>
  );
}
