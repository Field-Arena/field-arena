import type { Metadata } from 'next';
import { getRingStatus, listMyShows } from '@/modules/announcements/data/queries';
import { listStaff } from '@/modules/shows/data/setup-queries';
import { getShowStats } from '@/modules/shows/data/queries';
import { EmptyPanel } from '@/modules/staff/ui/workspace-page';
import { StatusBadge } from '@/shared/ui/status-badge';

export const metadata: Metadata = { title: 'Show Operations — Field & Arena' };

/**
 * The show-staff operations board, ported from showstaff-ops.html: ring status,
 * directories and stabling.
 *
 * Reuses the announcer's ring queries rather than duplicating them — both roles
 * need the same "what is happening in each ring" view, and the legacy views built
 * it twice.
 *
 * No money anywhere on this page. ShowStaff permission defaults are empty, so
 * financial panels would be hidden for every one of them; showing the shape of
 * something they can never see would only invite support questions.
 */
export default async function OperationsPage({
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
            <h1>Show Operations</h1>
            <p>Live board and on-the-ground operations.</p>
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

  const [rings, staff, stats] = await Promise.all([
    getRingStatus(currentShow.id),
    listStaff(currentShow.id),
    getShowStats(currentShow.id),
  ]);

  const live = rings.filter((r) => r.scoringOpen).length;

  return (
    <>
      <div className="dash-head">
        <div>
          <h1>Show Operations</h1>
          <p>Live board and on-the-ground operations.</p>
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

        <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
          <div className="stat">
            <div className="stat-label">Riders</div>
            <div className="stat-value">{stats.riders}</div>
          </div>
          <div className="stat">
            <div className="stat-label">Horses</div>
            <div className="stat-value">{stats.horses}</div>
          </div>
          <div className="stat">
            <div className="stat-label">Rings live</div>
            <div className="stat-value">{live}</div>
            <div className="stat-sub">of {rings.length}</div>
          </div>
          <div className="stat">
            <div className="stat-label">Staff on site</div>
            <div className="stat-value">{staff.length}</div>
          </div>
        </div>
      </div>

      <div className="dash-card">
        <h2 className="show-detail-title">Ring status</h2>
        {rings.length === 0 ? (
          <EmptyPanel title="No classes" note="This show has no classes configured yet." />
        ) : (
          <div className="cards" style={{ marginTop: 10 }}>
            {rings.map((ring) => (
              <div
                key={ring.classId}
                className={`card-row ${ring.scoringOpen ? 'today' : ''}`}
              >
                <div className="card-main">
                  <div className="card-title">{ring.className}</div>
                  <div className="card-meta">
                    {ring.ring ?? 'Ring not set'} · {ring.entryCount} rides
                  </div>
                </div>
                {ring.scoringOpen ? (
                  <>
                    <StatusBadge tone="warn">Live</StatusBadge>
                    {ring.current && (
                      <div style={{ textAlign: 'right', minWidth: 160 }}>
                        <div className="now-eyebrow">Now in ring</div>
                        <div style={{ fontWeight: 700 }}>
                          #{ring.current.num} {ring.current.rider ?? '—'}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <StatusBadge tone="neutral">Not started</StatusBadge>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="dash-card">
        <h2 className="show-detail-title">Staff directory</h2>
        {staff.length === 0 ? (
          <EmptyPanel title="Nobody staffed" note="No staff assigned to this show yet." />
        ) : (
          <div className="doc-list" style={{ marginTop: 10 }}>
            {staff.map((person) => (
              <div key={person.id} className="contact-row">
                <span className="avatar">
                  {person.name
                    .split(' ')
                    .map((w) => w[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </span>
                <div style={{ flex: 1 }}>
                  <div className="c-name">{person.name}</div>
                  <div className="c-role">
                    {person.role}
                    {person.phone && ` · ${person.phone}`}
                  </div>
                </div>
                {person.accepted ? (
                  <StatusBadge tone="success">Active</StatusBadge>
                ) : (
                  <StatusBadge tone="warn">Not accepted</StatusBadge>
                )}
              </div>
            ))}
          </div>
        )}
        <p className="doc-note">
          Stabling and the rider/horse directories need the roster detail views, which arrive with
          the entries module. Ring status and staffing are live.
        </p>
      </div>
    </>
  );
}
