import type { Metadata } from 'next';
import { getMyPermissions, listMyShows, listVendors } from '@/modules/operations/data/queries';
import { VendorsPanel } from '@/modules/operations/ui/vendors-panel';
import { EmptyPanel } from '@/modules/staff/ui/workspace-page';

export const metadata: Metadata = { title: 'Vendors — Field & Arena' };

export default async function OperationsVendorsPage({
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
            <h1>Vendors</h1>
            <p>Vendor booths and contacts on-site.</p>
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

  const permissions = await getMyPermissions(currentShow.id);
  const vendors = permissions.canViewMoney ? await listVendors(currentShow.id) : [];

  return (
    <>
      <div className="dash-head">
        <div>
          <h1>Vendors</h1>
          <p>Vendor booths and contacts on-site.</p>
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

      <VendorsPanel vendors={vendors} canViewVendors={permissions.canViewMoney} />
    </>
  );
}
