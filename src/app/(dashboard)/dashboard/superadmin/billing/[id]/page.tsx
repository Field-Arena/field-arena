import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeftIcon } from 'lucide-react';
import { getOrganizationBillingDetail } from '@/modules/superadmin/data/queries';
import { MoneyStatCards } from '@/modules/superadmin/ui/money-stat-cards';
import { SettlementSettings } from '@/modules/superadmin/ui/settlement-settings';
import { ShowBillingTable } from '@/modules/superadmin/ui/show-billing-table';
import { StripeStatusPill, STATUS_GUIDANCE } from '@/modules/superadmin/ui/stripe-status-pill';
import { formatTimestamp } from '@/shared/lib/format/date';
import { formatMoneyExact } from '@/shared/lib/format/currency';
import { cn } from '@/shared/lib/utils';

const NR = 'font-[family-name:var(--font-nr)]';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const org = await getOrganizationBillingDetail(id);
  return { title: org ? `${org.name} — Billing` : 'Billing' };
}

export default async function OrganizationBillingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const org = await getOrganizationBillingDetail(id);
  if (!org) notFound();

  const location = [org.city, org.region].filter(Boolean).join(', ');
  const money = (value: number) => formatMoneyExact(value, org.currency, org.locale);

  return (
    <div className="space-y-7">
      <div>
        <Link
          href="/dashboard/superadmin/billing"
          className="text-fa-muted hover:text-gold mb-4 inline-flex items-center gap-2 text-[13px] font-semibold transition-colors"
        >
          <ArrowLeftIcon className="size-4" aria-hidden />
          All organizers · Billing
        </Link>

        <h1
          className={`${NR} text-hunter-deep mb-2 text-[34px] leading-[1.06] font-medium tracking-[-.022em]`}
        >
          {org.name}
        </h1>
        <p className="text-fa-muted text-[14.5px] leading-[1.6]">
          {location ? `${location} · ` : ''}Stripe Connect account and deposit reconciliation for
          every show.
        </p>
      </div>

      <section className="border-line-mint rounded-xl border bg-[#F3F0E7] p-7">
        <h2 className={`${NR} text-hunter-deep mb-5 text-[22px] font-medium`}>
          Stripe Connect Account
        </h2>

        <dl className="border-line-mint grid grid-cols-2 gap-6 border-b pb-5 sm:grid-cols-4">
          <div>
            <dt className="text-fa-muted-2 mb-1.5 text-[10px] font-bold tracking-[.16em] uppercase">
              Status
            </dt>
            <dd>
              <StripeStatusPill status={org.stripeStatus} />
            </dd>
          </div>
          {[
            { label: 'Account ID', value: org.stripeAccountId ?? '—' },
            { label: 'Payouts', value: org.payoutsEnabled ? 'Enabled' : 'Paused' },
            { label: 'Charge type', value: 'Separate charges & transfers' },
          ].map((field) => (
            <div key={field.label}>
              <dt className="text-fa-muted-2 mb-1.5 text-[10px] font-bold tracking-[.16em] uppercase">
                {field.label}
              </dt>
              <dd className="text-hunter-deep truncate text-[14px] font-bold">{field.value}</dd>
            </div>
          ))}
        </dl>

        {org.stripeStatus === 'active' ? (
          <p className="text-fa-muted mt-5 text-[13.5px] leading-[1.6]">
            Account status, payout schedule and settlement history are read live from Stripe each
            time this page loads.
          </p>
        ) : (
          <p className="mt-5 text-[13.5px] leading-[1.6] text-[#8A6D14]">
            {STATUS_GUIDANCE[org.stripeStatus]}
            {org.stripeError ? ` (${org.stripeError})` : ''}
          </p>
        )}
      </section>

      <SettlementSettings
        orgId={org.id}
        payoutCadence={org.payoutCadence}
        holdbackPercent={org.holdbackPercent}
      />

      <MoneyStatCards
        stats={[
          { label: 'Collected (all shows)', value: money(org.volume) },
          { label: 'Platform fee retained', value: money(org.platformFee) },
          { label: 'Transferred to organizer', value: money(org.net) },
        ]}
      />

      <section aria-label="Per-show reconciliation" className="space-y-3">
        <h2 className={`${NR} text-hunter-deep text-[22px] font-medium`}>By show</h2>
        <ShowBillingTable rows={org.shows} currency={org.currency} locale={org.locale} />
      </section>

      <section aria-label="Payout history" className="space-y-3">
        <h2 className={`${NR} text-hunter-deep text-[22px] font-medium`}>Payout History</h2>
        {org.payouts.length === 0 ? (
          <div className="border-line rounded-[14px] border border-dashed bg-white px-5 py-12 text-center">
            <p className="text-fa-muted m-0 text-[13.5px] leading-[1.6]">
              {org.stripeStatus === 'not_connected'
                ? 'No Connect account is linked yet, so Stripe has no payouts to report.'
                : 'Stripe has no payouts on this account yet.'}
            </p>
          </div>
        ) : (
          <div className="border-line overflow-hidden rounded-[14px] border bg-white">
            <table className="w-full min-w-[520px] text-[13.5px]">
              <thead>
                <tr className="text-fa-muted-2 bg-[#F6F3EC] text-[10px] tracking-[.14em] uppercase">
                  <th className="px-5 py-[11px] text-left font-bold">Payout</th>
                  <th className="px-4 py-[11px] text-right font-bold">Amount</th>
                  <th className="px-5 py-[11px] text-left font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                {org.payouts.map((payout) => {
                  const paid = payout.status === 'paid';
                  return (
                    <tr key={payout.id} className="border-t border-[#EEF2EF]">
                      <td className="text-hunter-deep px-5 py-3">
                        {payout.arrivalDate
                          ? formatTimestamp(new Date(payout.arrivalDate).toISOString())
                          : payout.id}
                      </td>
                      <td className="text-hunter-deep px-4 py-3 text-right font-bold">
                        {money(payout.amount)}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={cn(
                            'inline-flex h-[22px] items-center gap-[6px] rounded-full px-2.5 text-[10.5px] font-bold',
                            paid ? 'bg-[#E4F1E8] text-[#2E7048]' : 'bg-[#F6EAC8] text-[#8A6D14]',
                          )}
                        >
                          {paid ? 'Paid' : payout.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
