import type { ScheduleEntry } from '@/modules/operations/types';
import { ScoreCell } from '@/modules/operations/ui/score-cell';

export function RideOrderTable({
  entries,
  className: classLabel = null,
}: {
  entries: ScheduleEntry[];

  /* Needed only so a posted score can open its detail — legacy's scoreLink
   * leaves a score inert when the class is unknown, and so does ScoreCell. */
  className?: string | null;
}) {
  if (entries.length === 0)
    return <p style={{ color: 'var(--fa-muted)', fontSize: 13 }}>No entries.</p>;
  return (
    <table>
      <thead>
        <tr>
          <th>Draw</th>
          <th>Rider</th>
          <th>Horse</th>
          <th className="r">Score</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((e) => (
          <tr key={e.num}>
            <td>{e.draw}</td>
            <td>
              #{e.num} · {e.rider}
            </td>
            <td>{e.horse}</td>
            <td className="r">
              {e.finalPctRaw != null ? (
                <ScoreCell
                  value={e.finalPctRaw}
                  num={e.num}
                  rider={e.rider}
                  horse={e.horse}
                  className={classLabel}
                />
              ) : (
                <span style={{ color: 'var(--fa-muted)' }}>To ride</span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
