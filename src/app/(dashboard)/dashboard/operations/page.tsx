import Link from 'next/link';
import type { Metadata } from 'next';
import { getRingStatus } from '@/modules/announcements/data/queries';
import { listStaff } from '@/modules/shows/data/setup-queries';
import { getShowStats } from '@/modules/shows/data/queries';
import {
  getMyPermissions,
  listMyShows,
  listStabling,
  listVendors,
  getHorseCounts,
} from '@/modules/operations/data/queries';
import { EmptyPanel } from '@/modules/staff/ui/workspace-page';
import { OpsAutoRefresh } from '@/modules/operations/ui/ops-auto-refresh';
import { OpsClock } from '@/modules/operations/ui/ops-clock';
import { groupRingsForBoard } from '@/modules/operations/utils/group-rings';
import { StatusBadge } from '@/shared/ui/status-badge';

export const metadata: Metadata = { title: 'Show Operations — Field & Arena' };

const statLinkStyle: React.CSSProperties = {
  color: 'inherit',
  textDecoration: 'none',
  display: 'block',
};

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

  const [rings, staff, stats, stabling, permissions, horses] = await Promise.all([
    getRingStatus(currentShow.id),
    listStaff(currentShow.id),
    getShowStats(currentShow.id),
    listStabling(currentShow.id),
    getMyPermissions(currentShow.id),
    getHorseCounts(currentShow.id),
  ]);
  const vendorCount = permissions.canViewMoney ? (await listVendors(currentShow.id)).length : null;

  // One card per ring, not per class — see groupRingsForBoard.
  const ringCards = groupRingsForBoard(rings);
  const live = ringCards.filter((r) => r.current?.scoringOpen).length;
  const navHref = (path: string) => `/dashboard/operations/${path}?show=${currentShow.id}`;

  return (
    <>
      <OpsAutoRefresh />

      <div className="dash-head">
        <div>
          <h1>Show Operations</h1>
          <p>Live board and on-the-ground operations.</p>
        </div>
        <OpsClock className="dash-clock" />
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
          <Link href={navHref('riders')} className="stat" style={statLinkStyle}>
            <div className="stat-label">Riders</div>
            <div className="stat-value">{stats.riders}</div>
          </Link>
          <Link href={navHref('horses')} className="stat" style={statLinkStyle}>
            <div className="stat-label">Horses</div>
            <div className="stat-value">
              {horses.today} / {horses.total}
            </div>
            <div className="stat-sub">today / entered</div>
          </Link>
          <Link href={navHref('stabling')} className="stat" style={statLinkStyle}>
            <div className="stat-label">Stalled</div>
            <div className="stat-value">{stabling.stalls.length}</div>
          </Link>
          <Link href={navHref('vendors')} className="stat" style={statLinkStyle}>
            <div className="stat-label">Vendors</div>
            <div className="stat-value">{vendorCount ?? '—'}</div>
            {vendorCount === null && <div className="stat-sub">No money access</div>}
          </Link>
        </div>
      </div>

      <div className="dash-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <h2 className="show-detail-title">Ring status</h2>
          <span className="stat-sub">
            {live} of {ringCards.length} live
          </span>
        </div>
        {ringCards.length === 0 ? (
          <EmptyPanel title="No classes" note="This show has no classes configured yet." />
        ) : (
          <div className="cards" style={{ marginTop: 10 }}>
            {ringCards.map((card) => {
              const cls = card.current;
              return (
                <Link
                  key={card.ring}
                  href={`/dashboard/operations/schedule?show=${currentShow.id}`}
                  className={`card-row ${cls?.scoringOpen ? 'today' : ''}`}
                  style={{ color: 'inherit', textDecoration: 'none' }}
                >
                  <div className="card-main">
                    <div className="card-title">{card.ring}</div>
                    <div className="card-meta">
                      {cls ? cls.className : 'Nothing scheduled'}
                      {cls ? ` · ${String(cls.position)} of ${String(cls.entryCount)} ridden` : ''}
                      {card.classCount > 1 ? ` · ${String(card.classCount)} classes today` : ''}
                    </div>
                  </div>
                  {cls?.scoringOpen ? (
                    <>
                      <StatusBadge tone="warn">Live</StatusBadge>
                      <div style={{ textAlign: 'right', minWidth: 160 }}>
                        {cls.current && (
                          <>
                            <div className="now-eyebrow">Now in ring</div>
                            <div style={{ fontWeight: 700 }}>
                              #{cls.current.num} {cls.current.rider ?? '—'}
                            </div>
                          </>
                        )}
                        {cls.upNext[0] && (
                          <div style={{ marginTop: cls.current ? 4 : 0 }}>
                            <span className="now-eyebrow">Next up</span> #{cls.upNext[0].num}{' '}
                            {cls.upNext[0].rider ?? '—'}
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <StatusBadge tone="neutral">Not started</StatusBadge>
                  )}
                </Link>
              );
            })}
          </div>
        )}
        <p className="doc-note" style={{ marginTop: 10 }}>
          Tap a class for its full order of go and placings on the Schedule tab.
        </p>
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
          Rider, horse, stabling, and vendor detail each have their own tab in the sidebar — the KPI
          tiles above jump straight there.
        </p>
      </div>
    </>
  );
}
