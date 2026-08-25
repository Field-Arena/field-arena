import { EmptyPanel } from '@/modules/staff/ui/workspace-page';
import type { ResultRow } from '@/modules/announcements/data/queries';

export function LiveResultsTable({ results }: { results: ResultRow[] }) {
  if (results.length === 0) {
    return (
      <EmptyPanel
        title="No scored rides yet"
        note="A rider appears here the moment their score is confirmed — before the organizer publishes standings for the class."
      />
    );
  }

  return (
    <div style={{ overflowX: 'auto', marginTop: 16 }}>
      <table>
        <caption className="sr-only">Live results</caption>
        <thead>
          <tr>
            <th scope="col">Class</th>
            <th scope="col" className="r">
              Place
            </th>
            <th scope="col">Rider</th>
            <th scope="col">Horse</th>
            <th scope="col" className="r">
              Score
            </th>
          </tr>
        </thead>
        <tbody>
          {results.map((row) => (
            <tr key={`${row.classLabel}-${row.num}`}>
              <td>{row.classLabel}</td>
              <td className="r">
                <strong>{row.place}</strong>
              </td>
              <td>
                #{row.num} {row.rider ?? '—'}
              </td>
              <td>{row.horse ?? '—'}</td>
              <td className="r">
                <span className="pct">{row.finalPct ?? '—'}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
