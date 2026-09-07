import { EmptyPanel } from '@/modules/staff/ui/workspace-page';
import { ANNOUNCING_RESULTS_PATH } from '@/modules/announcements/constants';
import type { HistoryRow } from '@/modules/announcements/data/queries';

export function AnnouncerHistoryTable({ history }: { history: HistoryRow[] }) {
  if (history.length === 0) {
    return (
      <EmptyPanel
        title="No completed shows yet"
        note="A show moves here the day after it finishes."
      />
    );
  }

  return (
    <div style={{ overflowX: 'auto', marginTop: 16 }}>
      <table>
        <caption className="sr-only">Shows you have announced</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Show</th>
            <th scope="col" className="r">
              Classes
            </th>
            <th scope="col" className="r">
              Rides scored
            </th>
            <th scope="col" />
          </tr>
        </thead>
        <tbody>
          {history.map((row) => (
            <tr key={row.showId}>
              <td>{row.dateLabel ?? row.startDate ?? '—'}</td>
              <td>
                <strong>{row.showName}</strong>
              </td>
              <td className="r">{row.classCount}</td>
              <td className="r">{row.scoredCount}</td>
              <td className="r">
                <a
                  href={`${ANNOUNCING_RESULTS_PATH}?show=${row.showId}`}
                  className="dash-btn dash-btn-outline"
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
