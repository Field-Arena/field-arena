import type { Metadata } from 'next';
import { getMyPermissions, listHorsesDirectory, listMyShows, listRidersDirectory, listVendors } from '@/modules/operations/data/queries';
import { FindPanel } from '@/modules/operations/ui/find-panel';
import { EmptyPanel } from '@/modules/staff/ui/workspace-page';

export const metadata: Metadata = { title: 'Find — Field & Arena' };

/** "Find" — `ROLE_NAV.ShowStaff`'s own top-level item, ported from showstaff-ops.html's Find tab. */
export default async function OperationsFindPage({
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
            <h1>Find</h1>
            <p>Look up a rider, horse, or vendor.</p>
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

  const [riders, horses, permissions] = await Promise.all([
    listRidersDirectory(currentShow.id),
    listHorsesDirectory(currentShow.id),
    getMyPermissions(currentShow.id),
  ]);
  // Matches legacy's blanket 403 on the whole vendors resource — fetched only
  // when permitted, same reasoning as the Vendors page itself.
  const vendors = permissions.canViewMoney ? await listVendors(currentShow.id) : [];

  return (
    <>
      <div className="dash-head">
        <div>
          <h1>Find</h1>
          <p>Look up a rider, horse, or vendor.</p>
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

      <FindPanel riders={riders} horses={horses} vendors={vendors} canViewVendors={permissions.canViewMoney} />
    </>
  );
}
