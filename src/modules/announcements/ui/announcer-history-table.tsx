import { cn } from '@/shared/lib/utils';
import {
  EmptyState,
  FA_BTN_SMALL,
  FA_TABLE,
  FA_TABLE_WRAP,
  FA_TD,
  FA_TH,
  FA_THEAD_ROW,
  FA_TR,
} from '@/shared/ui/organizer/fa-page';
import { ANNOUNCING_RESULTS_PATH } from '@/modules/announcements/constants';
import type { HistoryRow } from '@/modules/announcements/data/queries';

export function AnnouncerHistoryTable({ history }: { history: HistoryRow[] }) {
  if (history.length === 0) {
    return (
      <EmptyState
        title="No completed shows yet"
        note="A show moves here the day after it finishes."
      />
    );
  }

  return (
    <div className={FA_TABLE_WRAP}>
      <table className={FA_TABLE}>
        <caption className="sr-only">Shows you have announced</caption>
        <thead>
          <tr className={FA_THEAD_ROW}>
            <th scope="col" className={FA_TH}>
              Date
            </th>
            <th scope="col" className={FA_TH}>
              Show
            </th>
            <th scope="col" className={cn(FA_TH, 'text-right')}>
              Classes
            </th>
            <th scope="col" className={cn(FA_TH, 'text-right')}>
              Rides scored
            </th>
            <th scope="col" className={FA_TH} />
          </tr>
        </thead>
        <tbody>
          {history.map((row) => (
            <tr key={row.showId} className={FA_TR}>
              <td className={FA_TD}>{row.dateLabel ?? row.startDate ?? '—'}</td>
              <td className={cn(FA_TD, 'font-bold text-[#0D2C23]')}>{row.showName}</td>
              <td className={cn(FA_TD, 'text-right')}>{row.classCount}</td>
              <td className={cn(FA_TD, 'text-right')}>{row.scoredCount}</td>
              <td className={cn(FA_TD, 'text-right')}>
                <a
                  href={`${ANNOUNCING_RESULTS_PATH}?show=${row.showSlug ?? row.showId}`}
                  className={FA_BTN_SMALL}
                >
                  Results →
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
