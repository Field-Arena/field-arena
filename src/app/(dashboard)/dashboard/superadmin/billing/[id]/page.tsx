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
          className="mb-4 inline-flex items-center gap-2 text-[13px] font-semibold text-[#475467] transition-colors hover:text-[#146A47]"
        >
          <ArrowLeftIcon className="size-4" aria-hidden />
          All organizers · Billing
        </Link>

        <h1
          className={`${NR} mb-2 text-[34px] leading-[1.06] font-medium tracking-[-.022em] text-[#101828]`}
        >
          {org.name}
        </h1>
        <p className="text-[14.5px] leading-[1.6] text-[#475467]">
          {location ? `${location} · ` : ''}Stripe Connect account and deposit reconciliation for
          every show.
        </p>
      </div>

      <section className="rounded-xl border border-[#E7EAEE] bg-[#F5F7F8] p-7">
        <h2 className={`${NR} mb-5 text-[22px] font-medium text-[#101828]`}>
          Stripe Connect Account
        </h2>

        <dl className="grid grid-cols-2 gap-6 border-b border-[#E7EAEE] pb-5 sm:grid-cols-4">
          <div>
            <dt className="mb-1.5 text-[10px] font-bold tracking-[.08em] text-[#8A94A3] uppercase">
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
              <dt className="mb-1.5 text-[10px] font-bold tracking-[.08em] text-[#8A94A3] uppercase">
                {field.label}
              </dt>
              <dd className="truncate text-[14px] font-bold text-[#101828]">{field.value}</dd>
            </div>
          ))}
        </dl>

        {org.stripeStatus === 'active' ? (
          <p className="mt-5 text-[13.5px] leading-[1.6] text-[#475467]">
            Account status, payout schedule and settlement history are read live from Stripe each
            time this page loads.
          </p>
        ) : (
          <p className="mt-5 text-[13.5px] leading-[1.6] text-[#B45309]">
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
        <h2 className={`${NR} text-[22px] font-medium text-[#101828]`}>By show</h2>
        <ShowBillingTable rows={org.shows} currency={org.currency} locale={org.locale} />
      </section>

      <section aria-label="Payout history" className="space-y-3">
        <h2 className={`${NR} text-[22px] font-medium text-[#101828]`}>Payout History</h2>
        {org.payouts.length === 0 ? (
          <div className="rounded-[14px] border border-dashed border-[#E7EAEE] bg-white px-5 py-12 text-center">
            <p className="m-0 text-[13.5px] leading-[1.6] text-[#475467]">
              {org.stripeStatus === 'not_connected'
                ? 'No Connect account is linked yet, so Stripe has no payouts to report.'
                : 'Stripe has no payouts on this account yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[14px] border border-[#E7EAEE] bg-white">
            <table className="w-full min-w-[520px] text-[13.5px]">
              <thead>
                <tr className="bg-[#FBFCFD] text-[10px] tracking-[.08em] text-[#8A94A3] uppercase">
                  <th className="px-5 py-[11px] text-left font-bold">Payout</th>
                  <th className="px-4 py-[11px] text-right font-bold">Amount</th>
                  <th className="px-5 py-[11px] text-left font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                {org.payouts.map((payout) => {
                  const paid = payout.status === 'paid';
                  return (
                    <tr key={payout.id} className="border-t border-[#EEF1F4]">
                      <td className="px-5 py-3 text-[#101828]">
                        {payout.arrivalDate
                          ? formatTimestamp(new Date(payout.arrivalDate).toISOString())
                          : payout.id}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-[#101828]">
                        {money(payout.amount)}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={cn(
                            'inline-flex h-[22px] items-center gap-[6px] rounded-full px-2.5 text-[10.5px] font-bold',
                            paid ? 'bg-[#EAF5EF] text-[#15794F]' : 'bg-[#FDF2E3] text-[#B45309]',
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
