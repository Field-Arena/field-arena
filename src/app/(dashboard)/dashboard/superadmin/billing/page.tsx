import type { Metadata } from 'next';
import { getBillingSummary, listOrganizationBilling } from '@/modules/superadmin/data/queries';
import { MoneyStatCards } from '@/modules/superadmin/ui/money-stat-cards';
import { BillingTable } from '@/modules/superadmin/ui/billing-table';
import { formatMoneyExact } from '@/shared/lib/format/currency';

export const metadata: Metadata = {
  title: 'Billing — SuperAdmin Console',
};

const NR = 'font-[family-name:var(--font-nr)]';

/**
 * Platform billing.
 *
 * Everything computable from real rows is computed; anything that needs Stripe
 * says so. Payment processing is the one service kept outside Supabase, and no
 * charge has gone through this codebase yet — so zero here is a real figure, not
 * a placeholder.
 *
 * Built to the Admin Console design's Billing screen: eyebrow, heading, lead,
 * money cards, then billing per organizer. Nothing else belongs on it — fee-model
 * explainers and Stripe setup notes are not part of that screen.
 */
export default async function BillingPage() {
  const [summary, organizations] = await Promise.all([
    getBillingSummary(),
    listOrganizationBilling(),
  ]);

  // "Needing attention" means no Stripe Connect account: an organizer who cannot
  // be paid out, which is the one thing on this screen a platform owner must act
  // on. Every organization is in that state until the Stripe keys are set.
  const needingAttention = organizations.filter((org) => !org.stripeConnected).length;

  return (
    <div className="space-y-7">
      <div className="max-w-[680px]">
        <div className="mb-3 text-[10.5px] font-bold uppercase tracking-[0.18em] text-gold">
          Money
        </div>
        <h1
          className={`${NR} mb-2.5 text-[32px] font-medium leading-[1.06] tracking-[-.022em] text-hunter-deep`}
        >
          Billing
        </h1>
        <p className="text-[14.5px] leading-[1.6] text-fa-muted">
          Platform-wide Stripe Connect status and deposit reconciliation across every organizer.
          Search or pick an organizer above to reconcile their shows, review their Connect account,
          and check payout history.
        </p>
      </div>

      <MoneyStatCards
        stats={[
          { label: 'Platform volume', value: formatMoneyExact(summary.grossPaid) },
          { label: 'Platform fees earned', value: formatMoneyExact(summary.platformFees) },
          // Payout scheduling is Stripe's, so this stays zero until Connect is
          // wired rather than being derived from anything in our own tables.
          { label: 'Pending payouts', value: formatMoneyExact(0) },
          { label: 'Accounts needing attention', value: needingAttention },
        ]}
      />

      {(summary.pendingOrders > 0 || summary.failedOrders > 0) && (
        <p className="text-[13px] text-fa-muted">
          {summary.pendingOrders} pending and {summary.failedOrders} failed{' '}
          {summary.failedOrders === 1 ? 'checkout' : 'checkouts'} are excluded from every figure
          above. Pending orders older than six hours are marked abandoned automatically.
        </p>
      )}

      <BillingTable rows={organizations} />
    </div>
  );
}
