import type { ScheduleEntry } from '@/modules/operations/types';
import { ScoreCell } from '@/modules/operations/ui/score-cell';
import {
  FA_MUTED,
  FA_TABLE,
  FA_TABLE_WRAP,
  FA_TD,
  FA_TH,
  FA_THEAD_ROW,
  FA_TR,
} from '@/shared/ui/organizer/fa-page';

export function RideOrderTable({
  entries,
  className: classLabel = null,
}: {
  entries: ScheduleEntry[];

  /* Needed only so a posted score can open its detail — legacy's scoreLink
   * leaves a score inert when the class is unknown, and so does ScoreCell. */
  className?: string | null;
}) {
  if (entries.length === 0) return <p className={FA_MUTED}>No entries.</p>;
  return (
    <div className={FA_TABLE_WRAP}>
      <table className={FA_TABLE}>
        <thead>
          <tr className={FA_THEAD_ROW}>
            <th className={FA_TH}>Draw</th>
            <th className={FA_TH}>Rider</th>
            <th className={FA_TH}>Horse</th>
            <th className={`${FA_TH} text-right`}>Score</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={e.num} className={FA_TR}>
              <td className={`${FA_TD} text-[#5A6B63]`}>{e.draw}</td>
              <td className={FA_TD}>
                #{e.num} · {e.rider}
              </td>
              <td className={FA_TD}>{e.horse}</td>
              <td className={`${FA_TD} text-right font-bold`}>
                {e.finalPctRaw != null ? (
                  <ScoreCell
                    value={e.finalPctRaw}
                    num={e.num}
                    rider={e.rider}
                    horse={e.horse}
                    className={classLabel}
                  />
                ) : (
                  <span className="font-semibold text-[#5A6B63]">To ride</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
