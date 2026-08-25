import type { Metadata } from 'next';
import { getBillingSummary, listOrganizationBilling } from '@/modules/superadmin/data/queries';
import { MoneyStatCards } from '@/modules/superadmin/ui/money-stat-cards';
import { BillingTable } from '@/modules/superadmin/ui/billing-table';
import { formatMoneyExact } from '@/shared/lib/format/currency';

export const metadata: Metadata = {
  title: 'Billing — SuperAdmin Console',
};

const NR = 'font-[family-name:var(--font-nr)]';

export default async function BillingPage() {
  const [summary, organizations] = await Promise.all([
    getBillingSummary(),
    listOrganizationBilling(),
  ]);

  const needingAttention = organizations.filter((org) => !org.stripeConnected).length;

  return (
    <div className="space-y-7">
      <div className="max-w-[680px]">
        <div className="text-gold mb-3 text-[10.5px] font-bold tracking-[0.18em] uppercase">
          Money
        </div>
        <h1
          className={`${NR} text-hunter-deep mb-2.5 text-[32px] leading-[1.06] font-medium tracking-[-.022em]`}
        >
          Billing
        </h1>
        <p className="text-fa-muted text-[14.5px] leading-[1.6]">
          Platform-wide Stripe Connect status and deposit reconciliation across every organizer.
          Search or pick an organizer above to reconcile their shows, review their Connect account,
          and check payout history.
        </p>
      </div>

      <MoneyStatCards
        stats={[
          { label: 'Platform volume', value: formatMoneyExact(summary.grossPaid) },
          { label: 'Platform fees earned', value: formatMoneyExact(summary.platformFees) },

          { label: 'Pending payouts', value: formatMoneyExact(0) },
          { label: 'Accounts needing attention', value: needingAttention },
        ]}
      />

      {(summary.pendingOrders > 0 || summary.failedOrders > 0) && (
        <p className="text-fa-muted text-[13px]">
          {summary.pendingOrders} pending and {summary.failedOrders} failed{' '}
          {summary.failedOrders === 1 ? 'checkout' : 'checkouts'} are excluded from every figure
          above. Pending orders older than six hours are marked abandoned automatically.
        </p>
      )}

      <BillingTable rows={organizations} />
    </div>
  );
}
