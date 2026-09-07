import { EmptyPanel } from '@/modules/staff/ui/workspace-page';
import { StatusBadge } from '@/shared/ui/status-badge';
import type { ScheduleRow } from '@/modules/announcements/data/queries';

export function ShowScheduleTable({ schedule }: { schedule: ScheduleRow[] }) {
  if (schedule.length === 0) {
    return (
      <EmptyPanel
        title="No classes scheduled"
        note="Classes appear here once the organizer builds the show's schedule in ShowManager."
      />
    );
  }

  return (
    <div style={{ overflowX: 'auto', marginTop: 16 }}>
      <table>
        <caption className="sr-only">Today&apos;s ring times</caption>
        <thead>
          <tr>
            <th scope="col">Time</th>
            <th scope="col">Date</th>
            <th scope="col">Ring</th>
            <th scope="col">Class</th>
            <th scope="col" className="r">
              Rides
            </th>
            <th scope="col">State</th>
          </tr>
        </thead>
        <tbody>
          {schedule.map((row) => (
            <tr key={row.classId}>
              <td>{row.time ?? '—'}</td>
              <td>{row.date ?? '—'}</td>
              <td>{row.ring ?? '—'}</td>
              <td>
                <strong>{row.className}</strong>
              </td>
              <td className="r">{row.entryCount}</td>
              <td>
                {row.scoringOpen ? (
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
  );
}
