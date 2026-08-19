import { StatusBadge } from '@/shared/ui/status-badge';
import type { RingRow } from '@/modules/announcements/data/queries';

export function AllRingsTable({ rings }: { rings: RingRow[] }) {
  return (
    <>
      <h2 className="show-detail-title" style={{ marginTop: 26 }}>
        All rings
      </h2>
      <div style={{ overflowX: 'auto', marginTop: 10 }}>
        <table>
          <caption className="sr-only">Every class and its ring state</caption>
          <thead>
            <tr>
              <th scope="col">Class</th>
              <th scope="col">Ring</th>
              <th scope="col" className="r">
                Rides
              </th>
              <th scope="col">State</th>
            </tr>
          </thead>
          <tbody>
            {rings.map((ring) => (
              <tr key={ring.classId}>
                <td>
                  <strong>{ring.className}</strong>
                </td>
                <td>{ring.ring ?? '—'}</td>
                <td className="r">{ring.entryCount}</td>
                <td>
                  {ring.scoringOpen ? (
                    <StatusBadge tone="warn">Live</StatusBadge>
                  ) : (
                    <StatusBadge tone="neutral">Not started</StatusBadge>
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
