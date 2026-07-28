import Link from 'next/link';
import { SHOW_STAGES } from '../constants';
import { DashIcon } from './dash-icon';
import { formatMoney } from '@/shared/lib/format/currency';
import type { InventoryRow, ShowListItem, ShowStats } from '@/modules/shows/data/queries';

/**
 * The organizer dashboard.
 *
 * Every figure here now comes from the database. It previously rendered fixed
 * numbers from modules/staff/constants.ts — 115 riders, 226 entries, $21,690 —
 * which looked like a working dashboard while reading nothing.
 *
 * Two honesty changes came with the wiring:
 *
 *  - Revenue is split. The legacy dashboard showed one "Revenue (all-in)" figure
 *    that mixed collected money with estimates. Entry value (what the roster is
 *    worth at current class prices) and settled revenue (money actually taken)
 *    are different things, and conflating them on a billing screen is how an
 *    organizer ends up budgeting against money nobody has paid.
 *
 *  - The ring timers are gone. They were a hardcoded clock and three fixed
 *    delays. Live ring state comes from the scoring screen, which is not
 *    migrated, so the panel now lists the rings actually configured for the show
 *    and says timers arrive with live scoring, rather than animating fiction.
 */
export function DashboardOverview({
  orgName,
  shows,
  currentShow,
  stats,
  inventory,
  stage,
  rings,
  canViewMoney,
}: {
  orgName: string;
  shows: ShowListItem[];
  currentShow: ShowListItem | null;
  stats: ShowStats | null;
  inventory: InventoryRow[];
  stage: string;
  rings: string[];
  canViewMoney: boolean;
}) {
  const currentIndex = SHOW_STAGES.findIndex((s) => s.key === stage);

  if (!currentShow || !stats) {
    return (
      <>
        <div className="dash-head">
          <div>
            <h1>Dashboard</h1>
            <p>Everything across your shows, in one place.</p>
          </div>
        </div>
        <div className="dash-card">
          <p className="show-detail-title">No shows yet</p>
          <p className="show-detail-meta">
            {orgName} has no shows on the platform. Create one to see entries, staffing and revenue
            here.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="dash-head">
        <div>
          <h1>Dashboard</h1>
          <p>Everything across your shows, in one place.</p>
        </div>
        <button type="button" className="dash-btn dash-btn-dark">
          <DashIcon name="mobile" size={15} /> Mobile preview
        </button>
      </div>

      {/* Lifecycle stepper — derived from published, runner_state and published results */}
      <div className="dash-card">
        <div className="stepper">
          {SHOW_STAGES.map((s, i) => (
            <div key={s.key} style={{ display: 'contents' }}>
              <div className={`stepper-step${i === currentIndex ? ' current' : ''}`}>
                <span className="stepper-dot" />
                {s.label}
              </div>
              {i < SHOW_STAGES.length - 1 && <span className="stepper-line" />}
            </div>
          ))}
        </div>
      </div>

      <div className="dash-card">
        <div className="showbar">
          <span className="showbar-org">{orgName}</span>

          {/*
            A plain form with a GET submit, so switching shows works without
            JavaScript and keeps this a Server Component. The selected show lives
            in the URL, which also makes a particular show's dashboard linkable.
          */}
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
                  {show.dateLabel ? ` (${show.dateLabel})` : ''}
                </option>
              ))}
            </select>
            <button type="submit" className="dash-btn dash-btn-outline">
              Switch
            </button>
          </form>

          <div className="showbar-actions">
            <Link href="/dashboard/shows/new" className="dash-btn dash-btn-outline">
              <DashIcon name="plus" size={14} /> New Show
            </Link>
            <Link href={`/dashboard/shows/${currentShow.id}/results`} className="dash-btn dash-btn-outline">
              <DashIcon name="trophy" size={14} /> Results
            </Link>
          </div>
        </div>

        <div className="stat-grid">
          <Stat label="Total riders" value={stats.riders} sub="this show" />
          <Stat label="Entries sold" value={stats.entries} sub="this show" />
          <Stat label="Horses" value={stats.horses} sub="this show" />
          <Stat label="Vendor spaces" value={stats.vendorSpaces} sub="booths paid" />

          {/*
            Financial figures are gated on canViewMoney. The Organizer always sees
            them; a Show Admin only when explicitly granted, since money
            visibility defaults to false for every staff role including theirs.
          */}
          {canViewMoney && (
            <div className="stat revenue">
              <div className="stat-label">Revenue (settled)</div>
              <div className="stat-value">{formatMoney(stats.settledRevenue)}</div>
              <div className="stat-sub">
                {stats.settledRevenue === 0
                  ? 'no paid orders yet'
                  : 'collected through checkout'}
              </div>
            </div>
          )}
        </div>

        {canViewMoney && stats.entryValue > 0 && stats.settledRevenue === 0 && (
          <p className="stat-sub" style={{ marginTop: 10 }}>
            The roster is worth {formatMoney(stats.entryValue)} at current class prices, but nothing
            has been collected — rider checkout is not migrated yet, so this is genuinely unpaid
            rather than missing.
          </p>
        )}

        {/* Rings actually configured for this show. */}
        {rings.length > 0 && (
          <div className="dash-card" style={{ marginTop: 14, marginBottom: 0 }}>
            <div className="stat-label">Competition rings</div>
            <p className="show-detail-meta" style={{ margin: '6px 0 0' }}>
              {rings.join(' · ')} — live timers arrive with the scoring screen.
            </p>
          </div>
        )}
      </div>

      <div className="dash-card" style={{ borderLeft: '4px solid #1f7a44' }}>
        <h2 className="show-detail-title">{currentShow.name}</h2>
        <p className="show-detail-meta">
          {[currentShow.dateLabel, currentShow.venueName].filter(Boolean).join(' · ')}
        </p>

        <div className="inv-head">
          <span>Purchases &amp; inventory</span>
          <span>Qty</span>
          <span>{canViewMoney ? 'Value' : ''}</span>
        </div>
        {inventory.map((row) => (
          <div key={row.name} className="inv-row">
            <span className="inv-name">{row.name}</span>
            <span className="inv-qty">{row.qty}</span>
            <span className="inv-rev">
              {canViewMoney ? (
                <>
                  {formatMoney(row.revenue)}
                  {!row.settled && row.revenue > 0 && (
                    <span className="stat-sub" style={{ display: 'block' }}>
                      owed, not collected
                    </span>
                  )}
                </>
              ) : (
                ''
              )}
            </span>
          </div>
        ))}

        <div className="show-detail-foot">
          <span>
            {currentShow.published
              ? 'This show is published and visible to riders.'
              : 'This show is not published — riders cannot see or enter it yet.'}
          </span>
        </div>
      </div>
    </>
  );
}

function Stat({ label, value, sub }: { label: string; value: number; sub: string }) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-sub">{sub}</div>
    </div>
  );
}
