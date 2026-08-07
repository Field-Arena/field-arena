import type { Metadata } from 'next';
import { listMyShows, listSchedule } from '@/modules/operations/data/queries';
import { ScheduleList } from '@/modules/operations/ui/schedule-list';
import { EmptyPanel } from '@/modules/staff/ui/workspace-page';

export const metadata: Metadata = { title: 'Schedule — Field & Arena' };

/**
 * "Schedule" — ported from showstaff-ops.html's Schedule tab: the full
 * ring-by-ring running order for every day of the show, expandable per
 * class into its placings and full ride order.
 */
export default async function OperationsSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const { show: requestedShowId } = await searchParams;
  const shows = await listMyShows();
  const currentShow = shows.find((s) => s.id === requestedShowId) ?? shows[0] ?? null;

  if (!currentShow) {
    return (
      <>
        <div className="dash-head">
          <div>
            <h1>Schedule</h1>
            <p>The full ring-by-ring running order.</p>
          </div>
        </div>
        <div className="dash-card">
          <EmptyPanel
            title="No shows assigned"
            note="You are not staffed on any show yet. An organizer adds show staff from ShowManager."
          />
        </div>
      </>
    );
  }

  const classes = await listSchedule(currentShow.id);

  return (
    <>
      <div className="dash-head">
        <div>
          <h1>Schedule</h1>
          <p>Tap any class to see its results. Live classes show live results; upcoming classes show the draw order.</p>
        </div>
      </div>

      <div className="dash-card">
        <div className="showbar">
          <span className="showbar-org">{currentShow.name}</span>
          {shows.length > 1 && (
            <form method="get" className="contents">
              <select
                name="show"
                defaultValue={currentShow.id}
                className="dash-select"
                style={{ maxWidth: 380 }}
                aria-label="Select show"
              >
                {shows.map((show) => (
                  <option key={show.id} value={show.id}>
                    {show.name}
                  </option>
                ))}
              </select>
              <button type="submit" className="dash-btn dash-btn-outline">
                Switch
              </button>
            </form>
          )}
        </div>

        <div style={{ marginTop: 16 }}>
          <ScheduleList classes={classes} />
        </div>
      </div>
    </>
  );
}
