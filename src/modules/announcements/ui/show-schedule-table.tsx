import { cn } from '@/shared/lib/utils';
import {
  EmptyState,
  FA_TABLE,
  FA_TABLE_WRAP,
  FA_TD,
  FA_TH,
  FA_THEAD_ROW,
  FA_TR,
  Pill,
} from '@/shared/ui/organizer/fa-page';
import type { ScheduleRow } from '@/modules/announcements/data/queries';

export function ShowScheduleTable({ schedule }: { schedule: ScheduleRow[] }) {
  if (schedule.length === 0) {
    return (
      <EmptyState
        title="No classes scheduled"
        note="Classes appear here once the organizer builds the show's schedule in ShowManager."
      />
    );
  }

  return (
    <div className={FA_TABLE_WRAP}>
      <table className={FA_TABLE}>
        <caption className="sr-only">Today&apos;s ring times</caption>
        <thead>
          <tr className={FA_THEAD_ROW}>
            <th scope="col" className={FA_TH}>
              Time
            </th>
            <th scope="col" className={FA_TH}>
              Date
            </th>
            <th scope="col" className={FA_TH}>
              Ring
            </th>
            <th scope="col" className={FA_TH}>
              Class
            </th>
            <th scope="col" className={cn(FA_TH, 'text-right')}>
              Rides
            </th>
            <th scope="col" className={FA_TH}>
              State
            </th>
          </tr>
        </thead>
        <tbody>
          {schedule.map((row) => (
            <tr key={row.classId} className={FA_TR}>
              <td className={cn(FA_TD, 'font-bold text-[#0D2C23]')}>{row.time ?? '—'}</td>
              <td className={FA_TD}>{row.date ?? '—'}</td>
              <td className={FA_TD}>{row.ring ?? '—'}</td>
              <td className={cn(FA_TD, 'font-bold text-[#0D2C23]')}>{row.className}</td>
              <td className={cn(FA_TD, 'text-right')}>{row.entryCount}</td>
              <td className={FA_TD}>
                {row.scoringOpen ? (
                  <Pill tone="green" live>
                    Live
                  </Pill>
                ) : (
                  <Pill tone="grey">Not started</Pill>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
