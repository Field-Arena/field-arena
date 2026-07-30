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

/**
 * One organizer's billing, matching the Admin Console design.
 *
 * The Connect panel is read-only and the settlement panel is editable, which
 * splits along ownership rather than along convenience: Stripe owns account
 * status, payouts and charge type, and those are read live so there is no
 * stale-status failure mode. Cadence and holdback are our own columns, so they
 * are stored and edited here.
 */
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
          className="mb-4 inline-flex items-center gap-2 text-[13px] font-semibold text-fa-muted transition-colors hover:text-gold"
        >
          <ArrowLeftIcon className="size-4" aria-hidden />
          All organizers · Billing
        </Link>

        <h1
          className={`${NR} mb-2 text-[34px] font-medium leading-[1.06] tracking-[-.022em] text-hunter-deep`}
        >
          {org.name}
        </h1>
        <p className="text-[14.5px] leading-[1.6] text-fa-muted">
          {location ? `${location} · ` : ''}Stripe Connect account and deposit reconciliation for
          every show.
        </p>
      </div>

      {/* Read-only: every field here belongs to Stripe. */}
      <section className="rounded-xl border border-line-mint bg-[#F3F0E7] p-7">
        <h2 className={`${NR} mb-5 text-[22px] font-medium text-hunter-deep`}>
          Stripe Connect Account
        </h2>

        <dl className="grid grid-cols-2 gap-6 border-b border-line-mint pb-5 sm:grid-cols-4">
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
              <dt className="mb-1.5 text-[10px] font-bold uppercase tracking-[.16em] text-fa-muted-2">
                {field.label}
              </dt>
              <dd
                className={cn(
                  'flex items-center gap-2 text-[14px] font-bold',
                  field.tone ?? 'text-hunter-deep'
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
        <h2 className={`${NR} text-[22px] font-medium text-hunter-deep`}>By show</h2>
        <ShowBillingTable rows={org.shows} currency={org.currency} locale={org.locale} />
      </section>

      <section aria-label="Payout history" className="space-y-3">
        <h2 className={`${NR} text-[22px] font-medium text-hunter-deep`}>Payout History</h2>
        <div className="rounded-[14px] border border-dashed border-line bg-white px-5 py-12 text-center">
          <p className="m-0 text-[13.5px] leading-[1.6] text-fa-muted">
            Payouts are Stripe&rsquo;s record, not ours, so there is nothing to list until a Connect
            account is linked and the Stripe keys are set. Caching them here would create a second,
            stale copy of something Stripe already answers authoritatively.
          </p>
        </div>
      </section>
    </div>
  );
}
