import { cn } from '@/shared/lib/utils';
import {
  FA_TABLE,
  FA_TABLE_WRAP,
  FA_TD,
  FA_TH,
  FA_THEAD_ROW,
  FA_TR,
  Pill,
  SectionLabel,
} from '@/shared/ui/organizer/fa-page';
import type { RingRow } from '@/modules/announcements/data/queries';

export function AllRingsTable({ rings }: { rings: RingRow[] }) {
  return (
    <>
      <SectionLabel className="mt-6">All rings</SectionLabel>
      <div className={FA_TABLE_WRAP}>
        <table className={FA_TABLE}>
          <caption className="sr-only">Every class and its ring state</caption>
          <thead>
            <tr className={FA_THEAD_ROW}>
              <th scope="col" className={FA_TH}>
                Class
              </th>
              <th scope="col" className={FA_TH}>
                Ring
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
            {rings.map((ring) => (
              <tr key={ring.classId} className={FA_TR}>
                <td className={cn(FA_TD, 'font-bold text-[#0D2C23]')}>{ring.className}</td>
                <td className={FA_TD}>{ring.ring ?? '—'}</td>
                <td className={cn(FA_TD, 'text-right')}>{ring.entryCount}</td>
                <td className={FA_TD}>
                  {ring.scoringOpen ? (
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
    </>
  );
}
