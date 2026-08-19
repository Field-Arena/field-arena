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
      <div className="border-line rounded-[14px] border bg-white px-5 pt-14 pb-[60px] text-center">
        <div className={`${NR} text-hunter-deep mb-2 text-2xl`}>No shows built yet.</div>
        <p className="text-fa-muted-2 m-0 text-[13.5px]">
          Reconciliation appears per show once this organizer creates one.
        </p>
      </div>
    );
  }

  const money = (value: number) => formatMoneyExact(value, currency, locale);
  const tone = (value: number) => (value > 0 ? 'text-hunter-deep' : 'text-[#C4CDC8]');

  return (
    <div className="border-line rounded-[14px] border bg-white">
      <div className="overflow-x-auto">
        <div role="table" aria-label="Billing by show" className="min-w-[680px]">
          <div
            role="row"
            className={cn('border-line grid gap-3.5 border-b bg-[#F6F3EC] px-5 py-[11px]', COLUMNS)}
          >
            {['Show', 'Volume', 'Platform fee', 'Net'].map((label, index) => (
              <span
                key={label}
                role="columnheader"
                className={cn(
                  'text-fa-muted-2 text-[10px] font-bold tracking-[.14em] uppercase',
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
                'grid items-center gap-3.5 border-b border-[#EEF2EF] px-5 py-[15px] transition-colors last:border-b-0 hover:bg-[#FAFCFB]',
                COLUMNS,
              )}
            >
              <div role="cell" className="flex min-w-0 flex-col gap-1">
                <span className="text-hunter-deep truncate text-sm font-bold">{row.name}</span>
                <span className="text-fa-muted-2 text-xs">
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
