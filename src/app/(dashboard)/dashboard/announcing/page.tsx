import type { Metadata } from 'next';
import { getLiveResults, getRingStatus, listMyShows } from '@/modules/announcements/data/queries';
import { EmptyPanel } from '@/modules/staff/ui/workspace-page';
import { StatusBadge } from '@/shared/ui/status-badge';

export const metadata: Metadata = { title: 'Up Next — Field & Arena' };

/**
 * The announcer dashboard, ported from announcer.html: active rings, who rides
 * next, and published results.
 *
 * Read-only throughout, matching the permission model — an Announcer's defaults
 * are empty, because they call what is happening rather than change it.
 */
export default async function AnnouncingPage({
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
            <h1>Up Next</h1>
            <p>Ring status, running order and live results.</p>
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

  const [rings, results] = await Promise.all([
    getRingStatus(currentShow.id),
    getLiveResults(currentShow.id),
  ]);

  const liveRings = rings.filter((r) => r.scoringOpen);

  return (
    <>
      <div className="dash-head">
        <div>
          <h1>Up Next</h1>
          <p>Ring status, running order and live results.</p>
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

        <h2 className="show-detail-title" style={{ marginTop: 16 }}>
          Active rings
        </h2>
        {liveRings.length === 0 ? (
          <EmptyPanel
            title="Nothing live right now"
            note="A class appears here once its scoring is opened from the scoring screen."
          />
        ) : (
          <div className="cards" style={{ marginTop: 10 }}>
            {liveRings.map((ring) => (
              <div key={ring.classId} className="card-row today">
                <div className="card-main">
                  <div className="card-title">{ring.className}</div>
                  <div className="card-meta">
                    {ring.ring ?? 'Ring not set'} · ride {ring.position + 1} of {ring.entryCount}
                  </div>
                </div>
                {ring.nextUp ? (
                  <div style={{ textAlign: 'right' }}>
                    <div className="now-eyebrow">Up next</div>
                    <div style={{ fontWeight: 700 }}>
                      #{ring.nextUp.num} {ring.nextUp.rider ?? '—'}
                    </div>
                    <div className="card-meta">{ring.nextUp.horse ?? '—'}</div>
                  </div>
                ) : (
                  <StatusBadge tone="success">Ring complete</StatusBadge>
                )}
              </div>
            ))}
          </div>
        )}

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

        <h2 className="show-detail-title" style={{ marginTop: 26 }}>
          Results — live
        </h2>
        {results.length === 0 ? (
          <EmptyPanel
            title="No published results"
            note="Only published classes appear here. A class still being scored has no standings, and announcing a placing that later changes is worse than saying nothing."
          />
        ) : (
          <div style={{ overflowX: 'auto', marginTop: 10 }}>
            <table>
              <caption className="sr-only">Published results</caption>
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
