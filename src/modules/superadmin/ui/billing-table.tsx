import Link from 'next/link';
import { ArrowRightIcon } from 'lucide-react';
import { formatMoneyExact } from '@/shared/lib/format/currency';
import { cn } from '@/shared/lib/utils';
import type { OrganizationBilling } from '@/modules/superadmin/types';
import { StripeStatusPill } from '@/modules/superadmin/ui/stripe-status-pill';
import { OrgAvatar } from '@/shared/ui/organizer/org-avatar';

const COLUMNS = 'grid-cols-[minmax(200px,1fr)_150px_110px_120px_110px_140px]';
const NR = 'font-[family-name:var(--font-nr)]';

const HEADINGS = [
  'Organizer',
  'Stripe status',
  'Volume',
  'Platform fee',
  'Next payout',
  '',
] as const;

export function BillingTable({ rows }: { rows: OrganizationBilling[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-[14px] border border-[#E7EAEE] bg-white px-5 pt-14 pb-[60px] text-center">
        <div className={`${NR} mb-2 text-2xl text-[#101828]`}>No organizers yet.</div>
        <p className="m-0 text-[13.5px] text-[#8A94A3]">
          Billing appears here once an organizer is onboarded.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[14px] border border-[#E7EAEE] bg-white">
      <div className="overflow-x-auto">
        <div role="table" aria-label="Billing by organizer" className="min-w-[880px]">
          <div
            role="row"
            className={cn(
              'grid gap-3.5 border-b border-[#E7EAEE] bg-[#FBFCFD] px-5 py-[11px]',
              COLUMNS,
            )}
          >
            {HEADINGS.map((label) => (
              <span
                key={label || 'actions'}
                role="columnheader"
                className="text-[10px] font-bold tracking-[.08em] text-[#8A94A3] uppercase"
              >
                {label || <span className="sr-only">Actions</span>}
              </span>
            ))}
          </div>

          {rows.map((row) => {
            const money = (value: number) => formatMoneyExact(value, row.currency, row.locale);
            const tone = (value: number) => (value > 0 ? 'text-[#101828]' : 'text-[#C3CAD3]');
            const location = [row.city, row.region].filter(Boolean).join(', ');

            return (
              <div
                key={row.id}
                role="row"
                className={cn(
                  'grid items-center gap-3.5 border-b border-[#EEF1F4] px-5 py-[15px] transition-colors last:border-b-0 hover:bg-[#FBFCFD]',
                  COLUMNS,
                )}
              >
                <div role="cell" className="flex min-w-0 items-center gap-3">
                  <OrgAvatar name={row.name} />
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="truncate text-sm font-bold tracking-[-.005em] text-[#101828]">
                      {row.name}
                    </span>
                    <span className="truncate text-xs text-[#8A94A3]">
                      {location || 'No location set'}
                    </span>
                  </div>
                </div>

                <div role="cell">
                  <StripeStatusPill status={row.stripeStatus} />
                </div>

                <span role="cell" className={cn('text-sm', tone(row.gross))}>
                  {money(row.gross)}
                </span>
                <span role="cell" className={cn('text-sm', tone(row.platformFee))}>
                  {money(row.platformFee)}
                </span>

                <span role="cell" className={cn('text-sm', tone(row.pendingPayout))}>
                  {money(row.pendingPayout)}
                </span>

                <div role="cell">
                  <Link
                    href={`/dashboard/superadmin/billing/${row.id}`}
                    prefetch={false}
                    className="fa-filelink inline-flex items-center gap-1 whitespace-nowrap"
                  >
                    View
                    <ArrowRightIcon className="size-[13px]" aria-hidden />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 px-5 py-3.5">
        <span className="text-[12.5px] text-[#8A94A3]">
          {rows.length} {rows.length === 1 ? 'organizer' : 'organizers'}
        </span>
        <span className="text-[12.5px] text-[#8A94A3]">
          Volume and fees come from paid orders; Stripe status and pending payouts are read live
          from each Connect account.
        </span>
      </div>
    </div>
  );
}
