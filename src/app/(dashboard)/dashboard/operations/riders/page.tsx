import type { Metadata } from 'next';
import { listMyShows, listRidersDirectory } from '@/modules/operations/data/queries';
import { RidersPanel } from '@/modules/operations/ui/riders-panel';
import { EmptyPanel } from '@/modules/staff/ui/workspace-page';

export const metadata: Metadata = { title: 'Riders — Field & Arena' };

/** "Riders" — `ROLE_NAV.ShowStaff`'s own top-level item, ported from showstaff-ops.html's Riders tab. */
export default async function OperationsRidersPage({
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
            <h1>Riders</h1>
            <p>Every rider entered in this show.</p>
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

  const riders = await listRidersDirectory(currentShow.id);

  return (
    <>
      <div className="dash-head">
        <div>
          <h1>Riders</h1>
          <p>Every rider entered in this show.</p>
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
      </div>

      <RidersPanel riders={riders} />
    </>
  );
}
