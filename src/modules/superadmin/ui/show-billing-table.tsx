import { formatMoneyExact } from '@/shared/lib/format/currency';
import { formatDateRange } from '@/shared/lib/format/date';
import { cn } from '@/shared/lib/utils';
import type { ShowBilling } from '../types';

/** Per-show reconciliation for one organizer, in the console's table pattern. */
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
      <div className="rounded-[14px] border border-line bg-white px-5 pb-[60px] pt-14 text-center">
        <div className={`${NR} mb-2 text-2xl text-hunter-deep`}>No shows built yet.</div>
        <p className="m-0 text-[13.5px] text-fa-muted-2">
          Reconciliation appears per show once this organizer creates one.
        </p>
      </div>
    );
  }

  const money = (value: number) => formatMoneyExact(value, currency, locale);
  const tone = (value: number) => (value > 0 ? 'text-hunter-deep' : 'text-[#C4CDC8]');

  return (
    <div className="rounded-[14px] border border-line bg-white">
      <div className="overflow-x-auto">
        <div role="table" aria-label="Billing by show" className="min-w-[680px]">
          <div
            role="row"
            className={cn('grid gap-3.5 border-b border-line bg-[#F6F3EC] px-5 py-[11px]', COLUMNS)}
          >
            {['Show', 'Volume', 'Platform fee', 'Net'].map((label, index) => (
              <span
                key={label}
                role="columnheader"
                className={cn(
                  'text-[10px] font-bold uppercase tracking-[.14em] text-fa-muted-2',
                  index > 0 && 'text-right'
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
                COLUMNS
              )}
            >
              <div role="cell" className="flex min-w-0 flex-col gap-1">
                <span className="truncate text-sm font-bold text-hunter-deep">{row.name}</span>
                <span className="text-xs text-fa-muted-2">
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
