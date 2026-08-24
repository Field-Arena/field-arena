import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeftIcon } from 'lucide-react';
import { getOrganizationBillingDetail } from '@/modules/superadmin/data/queries';
import { MoneyStatCards } from '@/modules/superadmin/ui/money-stat-cards';
import { SettlementSettings } from '@/modules/superadmin/ui/settlement-settings';
import { ShowBillingTable } from '@/modules/superadmin/ui/show-billing-table';
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
          {[
            {
              label: 'Status',
              value: org.stripeConnected ? 'Connected' : 'Not connected',
              dot: org.stripeConnected ? '#3E8E5A' : '#C9A227',
              tone: org.stripeConnected ? 'text-[#2E7048]' : 'text-[#8A6D14]',
            },
            { label: 'Account ID', value: org.stripeConnected ? 'On file' : '—' },
            { label: 'Payouts', value: org.stripeConnected ? 'Active' : 'Paused' },
            { label: 'Charge type', value: 'Separate charges & transfers' },
          ].map((field) => (
            <div key={field.label}>
              <dt className="text-fa-muted-2 mb-1.5 text-[10px] font-bold tracking-[.16em] uppercase">
                {field.label}
              </dt>
              <dd
                className={cn(
                  'flex items-center gap-2 text-[14px] font-bold',
                  field.tone ?? 'text-hunter-deep',
                )}
              >
                {field.dot && (
                  <span
                    aria-hidden
                    className="size-[6px] flex-none rounded-full"
                    style={{ background: field.dot }}
                  />
                )}
                {field.value}
              </dd>
            </div>
          ))}
        </dl>

        <p className="mt-5 text-[13.5px] leading-[1.6] text-[#8A6D14]">
          {org.stripeConnected
            ? 'Account status, payout schedule and settlement history are read live from Stripe each time this page loads.'
            : "No Stripe Connect account linked yet — this organizer can't receive payouts until one is connected."}
        </p>
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
        <div className="border-line rounded-[14px] border border-dashed bg-white px-5 py-12 text-center">
          <p className="text-fa-muted m-0 text-[13.5px] leading-[1.6]">
            Payouts are Stripe&rsquo;s record, not ours, so there is nothing to list until a Connect
            account is linked and the Stripe keys are set. Caching them here would create a second,
            stale copy of something Stripe already answers authoritatively.
          </p>
        </div>
      </section>
    </div>
  );
}
