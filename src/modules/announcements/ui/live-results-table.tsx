import { cn } from '@/shared/lib/utils';
import {
  EmptyState,
  FA_TABLE,
  FA_TABLE_WRAP,
  FA_TD,
  FA_TH,
  FA_THEAD_ROW,
  FA_TR,
} from '@/shared/ui/organizer/fa-page';
import type { ResultRow } from '@/modules/announcements/data/queries';

export function LiveResultsTable({ results }: { results: ResultRow[] }) {
  if (results.length === 0) {
    return (
      <EmptyState
        title="No scored rides yet"
        note="A rider appears here the moment their score is confirmed — before the organizer publishes standings for the class."
      />
    );
  }

  return (
    <div className={FA_TABLE_WRAP}>
      <table className={FA_TABLE}>
        <caption className="sr-only">Live results</caption>
        <thead>
          <tr className={FA_THEAD_ROW}>
            <th scope="col" className={FA_TH}>
              Class
            </th>
            <th scope="col" className={cn(FA_TH, 'text-right')}>
              Place
            </th>
            <th scope="col" className={FA_TH}>
              Rider
            </th>
            <th scope="col" className={FA_TH}>
              Horse
            </th>
            <th scope="col" className={cn(FA_TH, 'text-right')}>
              Score
            </th>
          </tr>
        </thead>
        <tbody>
          {results.map((row) => (
            <tr key={`${row.classLabel}-${row.num}`} className={FA_TR}>
              <td className={FA_TD}>{row.classLabel}</td>
              <td className={cn(FA_TD, 'text-right font-bold text-[#0D2C23]')}>{row.place}</td>
              <td className={cn(FA_TD, 'font-semibold text-[#0D2C23]')}>
                #{row.num} {row.rider ?? '—'}
              </td>
              <td className={cn(FA_TD, 'text-[#5A6B63]')}>{row.horse ?? '—'}</td>
              <td className={cn(FA_TD, 'text-right font-mono font-semibold text-[#0D2C23]')}>
                {row.finalPct ?? '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
