import Link from 'next/link';
import { ArrowRightIcon } from 'lucide-react';
import { formatMoneyExact } from '@/shared/lib/format/currency';
import { cn } from '@/shared/lib/utils';
import type { OrganizationBilling } from '@/modules/superadmin/types';

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
      <div className="border-line rounded-[14px] border bg-white px-5 pt-14 pb-[60px] text-center">
        <div className={`${NR} text-hunter-deep mb-2 text-2xl`}>No organizers yet.</div>
        <p className="text-fa-muted-2 m-0 text-[13.5px]">
          Billing appears here once an organizer is onboarded.
        </p>
      </div>
    );
  }

  return (
    <div className="border-line rounded-[14px] border bg-white">
      <div className="overflow-x-auto">
        <div role="table" aria-label="Billing by organizer" className="min-w-[880px]">
          <div
            role="row"
            className={cn('border-line grid gap-3.5 border-b bg-[#F6F3EC] px-5 py-[11px]', COLUMNS)}
          >
            {HEADINGS.map((label) => (
              <span
                key={label || 'actions'}
                role="columnheader"
                className="text-fa-muted-2 text-[10px] font-bold tracking-[.14em] uppercase"
              >
                {label || <span className="sr-only">Actions</span>}
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
                  COLUMNS,
                )}
              >
                <div role="cell" className="flex min-w-0 flex-col gap-1">
                  <span className="text-hunter-deep truncate text-sm font-bold tracking-[-.005em]">
                    {row.name}
                  </span>
                  <span className="text-fa-muted-2 truncate text-xs">
                    {location || 'No location set'}
                  </span>
                </div>

                <div role="cell">
                  <span
                    className={cn(
                      'inline-flex h-[22px] flex-none items-center gap-[6px] rounded-full px-2.5 text-[10.5px] font-bold',
                      row.stripeConnected
                        ? 'bg-[#E4F1E8] text-[#2E7048] [--dot:#3E8E5A]'
                        : 'bg-[#F6EAC8] text-[#8A6D14] [--dot:#C9A227]',
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

                <span role="cell" className="text-sm text-[#C4CDC8]">
                  {money(0)}
                </span>

                <div role="cell">
                  <Link
                    href={`/dashboard/superadmin/billing/${row.id}`}
                    className="bg-hunter-deep text-paper hover:bg-gold hover:text-hunter-deep inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-[12.5px] font-bold whitespace-nowrap transition-colors"
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
        <span className="text-fa-muted-2 text-[12.5px]">
          {rows.length} {rows.length === 1 ? 'organizer' : 'organizers'}
        </span>
        <span className="text-[12.5px] text-[#9AA6A0]">
          Volume and fees come from paid orders. Payouts need Stripe Connect.
        </span>
      </div>
    </div>
  );
}
