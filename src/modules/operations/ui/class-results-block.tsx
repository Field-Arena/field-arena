import type { ScheduleClass } from '@/modules/operations/data/queries';
import { RibbonSwatch } from '@/modules/operations/ui/ribbon-swatch';
import { ScoreCell } from '@/modules/operations/ui/score-cell';
import { RideOrderTable } from '@/modules/operations/ui/ride-order-table';
import {
  FA_MUTED,
  FA_TABLE,
  FA_TABLE_WRAP,
  FA_TD,
  FA_TH,
  FA_THEAD_ROW,
  FA_TR,
} from '@/shared/ui/organizer/fa-page';

const SUBHEAD = 'mb-1.5 font-[family-name:var(--ws-fraunces)] text-[14px] font-bold text-[#0D2C23]';

export function ClassResultsBlock({ cls }: { cls: ScheduleClass }) {
  return (
    <div className="py-2">
      <p className={`mb-2.5 ${FA_MUTED}`}>
        {cls.status === 'upcoming'
          ? `Not started yet — ${String(cls.entryCount)} entered. Draw order below.`
          : cls.status === 'running'
            ? `Live — ${String(cls.scoredCount)} of ${String(cls.entryCount)} scored.`
            : 'Final results.'}
      </p>

      {cls.placings.length > 0 && (
        <>
          <h3 className={SUBHEAD}>Placings</h3>
          <div className={FA_TABLE_WRAP}>
            <table className={FA_TABLE}>
              <thead>
                <tr className={FA_THEAD_ROW}>
                  <th className={FA_TH}>Place</th>
                  <th className={FA_TH}>Rider</th>
                  <th className={FA_TH}>Horse</th>
                  <th className={`${FA_TH} text-right`}>Score</th>
                </tr>
              </thead>
              <tbody>
                {cls.placings.map((p) => (
                  <tr key={p.num} className={FA_TR}>
                    <td className={`${FA_TD} font-bold`}>
                      <RibbonSwatch place={p.place} />
                      {p.place}
                    </td>
                    <td className={FA_TD}>
                      #{p.num} · {p.rider}
                    </td>
                    <td className={FA_TD}>{p.horse}</td>
                    <td className={`${FA_TD} text-right font-bold`}>
                      <ScoreCell
                        value={p.finalPctRaw}
                        num={p.num}
                        rider={p.rider}
                        horse={p.horse}
                        className={cls.label}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <h3 className={`${SUBHEAD} ${cls.placings.length > 0 ? 'mt-3.5' : ''}`}>
        Scores in order of ride
      </h3>
      <RideOrderTable entries={cls.entries} className={cls.label} />
    </div>
  );
}
