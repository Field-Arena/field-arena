import type { Metadata } from 'next';
import { getOrganizerContext } from '@/modules/staff/data/context';
import { getShowBilling } from '@/modules/shows/data/setup-queries';
import { WorkspacePage, EmptyPanel } from '@/modules/staff/ui/workspace-page';
import { formatMoney } from '@/shared/lib/format/currency';

export const metadata: Metadata = { title: 'Billing — Field & Arena' };

/**
 * The show's simple profit-and-loss.
 *
 * Two things are kept deliberately apart. Collected revenue is money that has
 * actually moved; entry value is what the roster is worth at current class
 * prices, which nobody has paid. The legacy dashboard showed a single
 * "Revenue (all-in)" number mixing the two, and a P&L built on that overstates
 * income by whatever has not been collected.
 *
 * Expenses are a checklist stored on the show, not a ledger — the legacy schema
 * said so explicitly. This is a planning tool, not accounting.
 */
export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const { show: requestedShowId } = await searchParams;
  const context = await getOrganizerContext(requestedShowId);

  if (!context.canViewMoney) {
    return (
      <WorkspacePage
        title="Billing"
        description="Revenue, expenses and the show's profit and loss."
        orgName={context.orgName}
        showPicker={false}
      >
        <EmptyPanel
          title="Financial data is not shared with your account"
          note="Money visibility is granted per person and defaults to off for every staff role. Ask the organizer if you need it."
        />
      </WorkspacePage>
    );
  }

  if (!context.currentShow) {
    return (
      <WorkspacePage
        title="Billing"
        description="Revenue, expenses and the show's profit and loss."
        orgName={context.orgName}
        showPicker={false}
      >
        <EmptyPanel title="No shows yet" note="Billing is reported per show." />
      </WorkspacePage>
    );
  }

  const billing = await getShowBilling(context.currentShow.id);
  const collected = billing.settledRevenue + billing.vendorRevenue + billing.merchRevenue;
  const net = collected - billing.expenseTotal;

  return (
    <WorkspacePage
      title="Billing"
      description="Revenue, expenses and the show's profit and loss."
      orgName={context.orgName}
      shows={context.shows}
      currentShow={context.currentShow}
    >
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
        <div className="stat revenue">
          <div className="stat-label">Collected</div>
          <div className="stat-value">{formatMoney(collected)}</div>
          <div className="stat-sub">
            {billing.paidOrders === 0 ? 'no paid orders yet' : `${String(billing.paidOrders)} paid orders`}
          </div>
        </div>
        <div className="stat">
          <div className="stat-label">Entry value</div>
          <div className="stat-value">{formatMoney(billing.entryValue)}</div>
          <div className="stat-sub">owed, not collected</div>
        </div>
        <div className="stat">
          <div className="stat-label">Expenses</div>
          <div className="stat-value">{formatMoney(billing.expenseTotal)}</div>
          <div className="stat-sub">{billing.expenses.length} lines</div>
        </div>
        <div className="stat">
          <div className="stat-label">Net (collected)</div>
          <div className="stat-value" style={{ color: net < 0 ? '#b23a3a' : undefined }}>
            {formatMoney(net)}
          </div>
          <div className="stat-sub">collected minus expenses</div>
        </div>
      </div>

      <p className="doc-note">
        Net is deliberately calculated from money actually collected, not from entry value. Rider
        checkout is not migrated yet, so nothing has been taken — a P&amp;L against the roster&rsquo;s
        face value would overstate income by {formatMoney(billing.entryValue)}.
      </p>

      <h2 className="show-detail-title" style={{ marginTop: 26 }}>
        Revenue
      </h2>
      <div style={{ overflowX: 'auto', marginTop: 10 }}>
        <table>
          <caption className="sr-only">Revenue by source</caption>
          <thead>
            <tr>
              <th scope="col">Source</th>
              <th scope="col" className="r">
                Amount
              </th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Rider orders</td>
              <td className="r">{formatMoney(billing.settledRevenue)}</td>
              <td>Collected</td>
            </tr>
            <tr>
              <td>Vendor bookings</td>
              <td className="r">{formatMoney(billing.vendorRevenue)}</td>
              <td>Collected</td>
            </tr>
            <tr>
              <td>Merchandise</td>
              <td className="r">{formatMoney(billing.merchRevenue)}</td>
              <td>Collected</td>
            </tr>
            <tr>
              <td>Class entries on the roster</td>
              <td className="r">{formatMoney(billing.entryValue)}</td>
              <td style={{ color: 'var(--fa-muted)' }}>Not collected</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 className="show-detail-title" style={{ marginTop: 26 }}>
        Expenses
      </h2>
      {billing.expenses.length === 0 ? (
        <EmptyPanel
          title="No expenses recorded"
          note="Expenses are a cost checklist for this show — judge fees, arena rental, ribbons, shavings."
        />
      ) : (
        <div style={{ overflowX: 'auto', marginTop: 10 }}>
          <table>
            <caption className="sr-only">Expense lines</caption>
            <thead>
              <tr>
                <th scope="col">Line</th>
                <th scope="col" className="r">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {billing.expenses.map((expense) => (
                <tr key={expense.id}>
                  <td>{expense.label}</td>
                  <td className="r">{formatMoney(expense.amount)}</td>
                </tr>
              ))}
              <tr>
                <td>
                  <strong>Total</strong>
                </td>
                <td className="r">
                  <strong>{formatMoney(billing.expenseTotal)}</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </WorkspacePage>
  );
}
