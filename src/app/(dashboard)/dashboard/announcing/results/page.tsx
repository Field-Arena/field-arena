import type { Metadata } from 'next';
import { getLiveResults, listMyShows } from '@/modules/announcements/data/queries';
import { EmptyPanel } from '@/modules/staff/ui/workspace-page';

export const metadata: Metadata = { title: 'Results — Live — Field & Arena' };

/**
 * "Results — Live" — the Announcer rail's second nav item
 * (`ROLE_NAV.Announcer`, `modules/staff/constants.ts`), which pointed here
 * with no page behind it until now. This table used to live inline on the
 * "Up Next" page instead; it now has the route the nav item always promised,
 * and the "Up Next" page links here rather than duplicating it. See
 * `getLiveResults`'s doc comment for why this shows every confirmed score,
 * not just classes the organizer has explicitly published.
 */
export default async function AnnouncingResultsPage({
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
            <h1>Results — Live</h1>
            <p>Every rider&apos;s score, the moment it&apos;s confirmed — class by class.</p>
          </div>
        </div>
        <div className="dash-card">
          <EmptyPanel
            title="No shows assigned"
            note="You are not staffed on any show yet. An organizer adds an announcer from ShowManager."
          />
        </div>
      </>
    );
  }

  const results = await getLiveResults(currentShow.id);

  return (
    <>
      <div className="dash-head">
        <div>
          <h1>Results — Live</h1>
          <p>Every rider&apos;s score, the moment it&apos;s confirmed — class by class.</p>
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

        {results.length === 0 ? (
          <EmptyPanel
            title="No scored rides yet"
            note="A rider appears here the moment their score is confirmed — before the organizer publishes standings for the class."
          />
        ) : (
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
        )}
      </div>
    </>
  );
}
