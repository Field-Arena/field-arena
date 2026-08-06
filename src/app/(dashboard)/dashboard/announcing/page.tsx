import type { Metadata } from 'next';
import { getRingStatus, listMyShows } from '@/modules/announcements/data/queries';
import { EmptyPanel } from '@/modules/staff/ui/workspace-page';
import { StatusBadge } from '@/shared/ui/status-badge';

export const metadata: Metadata = { title: 'Up Next — Field & Arena' };

/**
 * The announcer dashboard, ported from announcer.html: active rings, who's
 * actually in the ring right now, and who rides next. Live results (every
 * score as it's confirmed) live on their own page — see
 * `/dashboard/announcing/results`.
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

  const rings = await getRingStatus(currentShow.id);

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
              <div key={ring.classId} className="card-row today" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <div className="card-main">
                    <div className="card-title">{ring.className}</div>
                    <div className="card-meta">
                      {ring.ring ?? 'Ring not set'} · ride {ring.position + 1} of {ring.entryCount}
                    </div>
                  </div>
                  {ring.current ? (
                    <div style={{ textAlign: 'right' }}>
                      <div className="now-eyebrow">Now in ring</div>
                      <div style={{ fontWeight: 700 }}>
                        #{ring.current.num} {ring.current.rider ?? '—'}
                      </div>
                      <div className="card-meta">{ring.current.horse ?? '—'}</div>
                    </div>
                  ) : (
                    <StatusBadge tone="success">Ring complete</StatusBadge>
                  )}
                </div>
                {ring.upNext.length > 0 && (
                  <div style={{ borderTop: '1px solid #E9EDEB', paddingTop: 8 }}>
                    <div className="now-eyebrow">Up next</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 18px', marginTop: 4 }}>
                      {ring.upNext.map((entry) => (
                        <span key={entry.num} className="card-meta">
                          #{entry.num} {entry.rider ?? '—'}
                        </span>
                      ))}
                    </div>
                  </div>
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

        <p style={{ marginTop: 26 }}>
          <a href={`/dashboard/announcing/results?show=${currentShow.id}`} className="dash-btn dash-btn-outline">
            View results — live →
          </a>
        </p>
      </div>
    </>
  );
}
