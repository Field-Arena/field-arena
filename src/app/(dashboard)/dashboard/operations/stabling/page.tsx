import type { Metadata } from 'next';
import { listMyShows, listStabling } from '@/modules/operations/data/queries';
import { StablingPanel } from '@/modules/operations/ui/stabling-panel';
import { EmptyPanel } from '@/modules/staff/ui/workspace-page';

export const metadata: Metadata = { title: 'Stabling — Field & Arena' };

/** "Stabling" — `ROLE_NAV.ShowStaff`'s own top-level item, ported from showstaff-ops.html's Stabling tab. */
export default async function OperationsStablingPage({
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
            <h1>Stabling</h1>
            <p>Stall assignments and arrivals.</p>
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

  const stabling = await listStabling(currentShow.id);

  return (
    <>
      <div className="dash-head">
        <div>
          <h1>Stabling</h1>
          <p>Stall assignments and arrivals.</p>
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

      <StablingPanel stabling={stabling} />
    </>
  );
}
