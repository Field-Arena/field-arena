import { formatMoneyExact } from '@/shared/lib/format/currency';
import { formatDateRange } from '@/shared/lib/format/date';
import { cn } from '@/shared/lib/utils';
import type { ShowBilling } from '@/modules/superadmin/types';

const COLUMNS = 'grid-cols-[minmax(220px,1fr)_130px_130px_130px]';
const NR = 'font-[family-name:var(--font-nr)]';

export function ShowBillingTable({
  rows,
  currency,
  locale,
}: {
  rows: ShowBilling[];
  currency: string | null;
  locale: string | null;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-[14px] border border-[#E7EAEE] bg-white px-5 pt-14 pb-[60px] text-center">
        <div className={`${NR} mb-2 text-2xl text-[#101828]`}>No shows built yet.</div>
        <p className="m-0 text-[13.5px] text-[#8A94A3]">
          Reconciliation appears per show once this organizer creates one.
        </p>
      </div>
    );
  }

  const money = (value: number) => formatMoneyExact(value, currency, locale);
  const tone = (value: number) => (value > 0 ? 'text-[#101828]' : 'text-[#C3CAD3]');

  return (
    <div className="rounded-[14px] border border-[#E7EAEE] bg-white">
      <div className="overflow-x-auto">
        <div role="table" aria-label="Billing by show" className="min-w-[680px]">
          <div
            role="row"
            className={cn(
              'grid gap-3.5 border-b border-[#E7EAEE] bg-[#FBFCFD] px-5 py-[11px]',
              COLUMNS,
            )}
          >
            {['Show', 'Volume', 'Platform fee', 'Net'].map((label, index) => (
              <span
                key={label}
                role="columnheader"
                className={cn(
                  'text-[10px] font-bold tracking-[.08em] text-[#8A94A3] uppercase',
                  index > 0 && 'text-right',
                )}
              >
                {label}
              </span>
            ))}
          </div>

          {rows.map((row) => (
            <div
              key={row.id}
              role="row"
              className={cn(
                'grid items-center gap-3.5 border-b border-[#EEF1F4] px-5 py-[15px] transition-colors last:border-b-0 hover:bg-[#FBFCFD]',
                COLUMNS,
              )}
            >
              <div role="cell" className="flex min-w-0 flex-col gap-1">
                <span className="truncate text-sm font-bold text-[#101828]">{row.name}</span>
                <span className="text-xs text-[#8A94A3]">
                  {formatDateRange(row.startDate, row.endDate) || 'No dates set'}
                </span>
              </div>
              <span role="cell" className={cn('text-right text-sm', tone(row.volume))}>
                {money(row.volume)}
              </span>
              <span role="cell" className={cn('text-right text-sm', tone(row.platformFee))}>
                {money(row.platformFee)}
              </span>
              <span role="cell" className={cn('text-right text-sm font-bold', tone(row.net))}>
                {money(row.net)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
