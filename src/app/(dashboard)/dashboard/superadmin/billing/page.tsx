import type { Metadata } from 'next';
import { getPlatformStats, listOrganizations } from '@/modules/superadmin/data/queries';
import { StatTile } from '@/shared/ui/stat-tile';
import { formatMoney } from '@/shared/lib/format/currency';
import { calcPlatformFee, calcPlatformFeeFlat8 } from '@/shared/lib/fees';

export const metadata: Metadata = {
  title: 'Billing — SuperAdmin Console',
};

/**
 * Platform billing.
 *
 * Everything here that can be computed from real rows is; everything that needs
 * Stripe says so. Payment processing stays on Stripe — the one service kept
 * outside Supabase — and no charges have been made through this codebase yet, so
 * settled revenue is genuinely zero rather than unavailable.
 *
 * What IS real is the fee model per organization, which decides what every entry
 * costs. The worked example below runs the actual formulas from shared/lib/fees,
 * the same functions a charge will use, rather than restating the percentages in
 * prose where they could drift from the code.
 */
export default async function BillingPage() {
  const [stats, organizations] = await Promise.all([getPlatformStats(), listOrganizations()]);

  const gmoOrgs = organizations.filter((o) => o.feeModel === 'gmo');
  const sampleEntryFee = 65;

  return (
    <div className="space-y-7">
      <div>
        <h1 className="mb-1 font-serif text-[32px] font-bold leading-tight text-hunter-deep">
          Billing
        </h1>
        <p className="text-fa-muted text-[15px]">Platform revenue and per-organization fee model.</p>
      </div>

      <section aria-label="Revenue">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile
            label="Settled revenue"
            value={formatMoney(stats.revenue)}
            sub={`${String(stats.paidOrders)} paid orders`}
            tone="money"
          />
          <StatTile label="Organizations" value={stats.organizations} sub="billable accounts" />
          <StatTile label="GMO fee model" value={gmoOrgs.length} sub="flat 18% on entries" />
          <StatTile
            label="Default fee model"
            value={organizations.length - gmoOrgs.length}
            sub="$7.99 floor, then 8%"
          />
        </div>
      </section>

      <section
        aria-label="Fee model"
        className="space-y-3 rounded-xl border border-border bg-white p-5"
      >
        <h2 className="font-serif text-lg font-bold text-hunter-deep">How fees are calculated</h2>
        <p className="text-fa-muted text-sm leading-relaxed">
          Two formulas apply, and which one is used depends on what is being charged rather than on
          who is charging. Class entry fees follow the organization&rsquo;s fee model; add-ons,
          qualifying fees and vendor booths always take a flat 8% with no floor, GMO organizations
          included.
        </p>

        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full border-collapse text-[13.5px]">
            <caption className="sr-only">
              Worked platform-fee example on a {formatMoney(sampleEntryFee)} charge
            </caption>
            <thead>
              <tr className="bg-hunter-pale">
                {['Charge type', 'Rule', `Fee on ${formatMoney(sampleEntryFee)}`].map(
                  (heading, i) => (
                    <th
                      key={heading}
                      scope="col"
                      className={`text-fa-muted px-3 py-2.5 text-[11px] font-bold uppercase tracking-[0.04em] ${
                        i === 2 ? 'text-right' : 'text-left'
                      }`}
                    >
                      {heading}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="px-3 py-2.5 font-semibold text-hunter-deep">
                  Class entry — default
                </td>
                <td className="text-fa-muted px-3 py-2.5">$7.99 floor, otherwise 8%</td>
                <td className="px-3 py-2.5 text-right font-semibold text-hunter-deep">
                  {formatMoney(calcPlatformFee(sampleEntryFee, 'default'))}
                </td>
              </tr>
              <tr className="border-b border-border">
                <td className="px-3 py-2.5 font-semibold text-hunter-deep">Class entry — GMO</td>
                <td className="text-fa-muted px-3 py-2.5">Flat 18%, no floor</td>
                <td className="px-3 py-2.5 text-right font-semibold text-hunter-deep">
                  {formatMoney(calcPlatformFee(sampleEntryFee, 'gmo'))}
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2.5 font-semibold text-hunter-deep">
                  Add-ons, qualifying, vendor booths
                </td>
                <td className="text-fa-muted px-3 py-2.5">Flat 8%, no floor, any fee model</td>
                <td className="px-3 py-2.5 text-right font-semibold text-hunter-deep">
                  {formatMoney(calcPlatformFeeFlat8(sampleEntryFee))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="text-fa-muted text-xs leading-relaxed">
          Figures above are computed by the same functions that price a real charge, so they cannot
          drift from what is billed. The platform fee is never refundable: a refund is capped at
          amount charged minus the fee, enforced by a CHECK constraint on the orders table rather
          than only in application code.
        </p>
      </section>

      <section
        aria-label="Not yet available"
        className="rounded-xl border border-dashed border-border bg-white p-5"
      >
        <h2 className="mb-1.5 font-serif text-base font-bold text-hunter-deep">
          Requires Stripe to be wired
        </h2>
        <p className="text-fa-muted text-sm leading-relaxed">
          Payout schedules, Connect onboarding status and settlement history all read from Stripe.
          Connect onboarding completeness is deliberately not cached in our database — it is checked
          live each time, so there is no stale-status failure mode — which also means none of it can
          be shown until the Stripe keys are set.
        </p>
      </section>
    </div>
  );
}
