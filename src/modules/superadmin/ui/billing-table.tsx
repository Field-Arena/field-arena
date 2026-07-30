import Link from 'next/link';
import { ArrowRightIcon } from 'lucide-react';
import { formatMoneyExact } from '@/shared/lib/format/currency';
import { cn } from '@/shared/lib/utils';
import type { OrganizationBilling } from '../data/queries';

/**
 * Per-organizer billing, matching the Admin Console design: organizer, Stripe
 * status, volume, platform fee, next payout, and a way into that organizer.
 *
 * "View billing" opens that organizer's own billing page, which holds their
 * Connect account, settlement settings, per-show reconciliation and payout
 * history.
 *
 * formatMoneyExact, not formatMoney: the latter drops cents by design, which is
 * fine for an organizer-facing total and wrong here. The default entry fee is
 * $7.99 and rounding it to $8 misstates figures that get reconciled against
 * Stripe.
 */
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
      <div className="rounded-[14px] border border-line bg-white px-5 pb-[60px] pt-14 text-center">
        <div className={`${NR} mb-2 text-2xl text-hunter-deep`}>No organizers yet.</div>
        <p className="m-0 text-[13.5px] text-fa-muted-2">
          Billing appears here once an organizer is onboarded.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[14px] border border-line bg-white">
      <div className="overflow-x-auto">
        <div role="table" aria-label="Billing by organizer" className="min-w-[880px]">
          <div
            role="row"
            className={cn('grid gap-3.5 border-b border-line bg-[#F6F3EC] px-5 py-[11px]', COLUMNS)}
          >
            {HEADINGS.map((label, index) => (
              <span
                key={label || 'actions'}
                role="columnheader"
                className="text-[10px] font-bold uppercase tracking-[.14em] text-fa-muted-2"
              >
                {label || <span className="sr-only">Actions</span>}
                {index === 0 ? null : null}
              </span>
            ))}
          </div>

          {rows.map((row) => {
            const money = (value: number) => formatMoneyExact(value, row.currency, row.locale);
            const tone = (value: number) => (value > 0 ? 'text-hunter-deep' : 'text-[#C4CDC8]');
            const location = [row.city, row.region].filter(Boolean).join(', ');

            return (
              <div
                key={row.id}
                role="row"
                className={cn(
                  'grid items-center gap-3.5 border-b border-[#EEF2EF] px-5 py-[15px] transition-colors last:border-b-0 hover:bg-[#FAFCFB]',
                  COLUMNS
                )}
              >
                <div role="cell" className="flex min-w-0 flex-col gap-1">
                  <span className="truncate text-sm font-bold tracking-[-.005em] text-hunter-deep">
                    {row.name}
                  </span>
                  <span className="truncate text-xs text-fa-muted-2">
                    {location || 'No location set'}
                  </span>
                </div>

                <div role="cell">
                  <span
                    className={cn(
                      'inline-flex h-[22px] flex-none items-center gap-[6px] rounded-full px-2.5 text-[10.5px] font-bold',
                      row.stripeConnected
                        ? 'bg-[#E4F1E8] text-[#2E7048] [--dot:#3E8E5A]'
                        : 'bg-[#F6EAC8] text-[#8A6D14] [--dot:#C9A227]'
                    )}
                  >
                    <span aria-hidden className="size-[5px] rounded-full bg-[var(--dot)]" />
                    {row.stripeConnected ? 'Connected' : 'Not connected'}
                  </span>
                </div>

                <span role="cell" className={cn('text-sm', tone(row.gross))}>
                  {money(row.gross)}
                </span>
                <span role="cell" className={cn('text-sm', tone(row.platformFee))}>
                  {money(row.platformFee)}
                </span>
                {/* Payout scheduling lives in Stripe. Until Connect is wired there
                    is nothing to report, so this is a real zero, not a blank. */}
                <span role="cell" className="text-sm text-[#C4CDC8]">
                  {money(0)}
                </span>

                <div role="cell">
                  <Link
                    href={`/dashboard/superadmin/billing/${row.id}`}
                    className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg bg-hunter-deep px-3.5 py-2 text-[12.5px] font-bold text-paper transition-colors hover:bg-gold hover:text-hunter-deep"
                  >
                    View billing
                    <ArrowRightIcon className="size-[13px]" aria-hidden />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 px-5 py-3.5">
        <span className="text-[12.5px] text-fa-muted-2">
          {rows.length} {rows.length === 1 ? 'organizer' : 'organizers'}
        </span>
        <span className="text-[12.5px] text-[#9AA6A0]">
          Volume and fees come from paid orders. Payouts need Stripe Connect.
        </span>
      </div>
    </div>
  );
}
