import type { ScheduleEntry } from '@/modules/operations/data/queries';

export function RideOrderTable({ entries }: { entries: ScheduleEntry[] }) {
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
                <span className="pct">{e.finalPctRaw}</span>
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
