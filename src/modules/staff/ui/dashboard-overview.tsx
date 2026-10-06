import Link from 'next/link';
import { NewShowButton } from '@/modules/shows/public';
import { ShowStatsRow } from './show-stats-row';
import { formatMoney } from '@/shared/lib/format/currency';
import { formatRelative } from '@/shared/lib/format/date';
import type {
  ActivityItem,
  AttentionItem,
  DashboardReadiness,
  DashboardShowRow,
  InventoryRow,
  ShowListItem,
  ShowStats,
} from '@/modules/shows/types';
import { AttentionCards } from './attention-card';
import { DashboardShowsTable } from './dashboard-shows-table';
import { DashboardReadinessCard } from './dashboard-readiness-card';

const CalendarIcon = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8 3v3M16 3v3M4 8h16M5 5h14a1 1 0 011 1v13a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z"
    />
  </svg>
);

export function DashboardOverview({
  orgName,
  shows,
  dashboardShows,
  currentShow,
  stats,
  inventory,
  stage,
  readiness,
  rings,
  attention = [],
  activity = [],
  canViewMoney,
}: {
  orgName: string;
  shows: ShowListItem[];
  dashboardShows: DashboardShowRow[];
  currentShow: ShowListItem | null;
  stats: ShowStats | null;
  inventory: InventoryRow[];
  stage: string;
  readiness: DashboardReadiness | null;
  rings: string[];
  attention?: AttentionItem[];
  activity?: ActivityItem[];
  canViewMoney: boolean;
}) {
  if (!currentShow || !stats) {
    return (
      <section>
        <div className="fa-page-head">
          <div>
            <h2>Dashboard</h2>
            <p>Everything across your shows in one place.</p>
          </div>
        </div>
        <div className="fa-mini-card">
          <h4>No shows yet</h4>
          <p>
            {orgName} has no shows on the platform. Create one to see entries, staffing and revenue
            here.
          </p>
          <NewShowButton className="mt-4" />
        </div>
      </section>
    );
  }

  const incompleteCount = shows.filter((s) => !s.published).length;
  const showRef = currentShow.slug ?? currentShow.id;

  return (
    <section>
      <div className="fa-page-head">
        <div>
          <h2>Dashboard</h2>
          <p>
            Everything across your shows in one place. Focused show: <b>{currentShow.name}</b>
            {currentShow.dateLabel && ` · ${currentShow.dateLabel}`}.
          </p>
        </div>
        <div className="fa-head-actions">
          <NewShowButton />
          <Link
            href={`/dashboard/schedule?show=${showRef}`}
            prefetch={false}
            className="fa-btn fa-btn-primary"
          >
            <CalendarIcon />
            Open Schedule
          </Link>
        </div>
      </div>

      <AttentionCards items={attention} incompleteCount={incompleteCount} />

      <div className="mb-6">
        <ShowStatsRow stats={stats} canViewMoney={canViewMoney} showId={showRef} />
      </div>

      <div className="fa-detail-grid">
        <DashboardShowsTable shows={dashboardShows} focusedShowId={currentShow.id} />

        <aside>
          {readiness && (
            <DashboardReadinessCard
              showName={currentShow.name}
              startDate={currentShow.startDate}
              stage={stage}
              stats={stats}
              readiness={readiness}
            />
          )}

          <div className="fa-aside-card">
            <h4>Recent activity</h4>
            {activity.length === 0 ? (
              <p className="m-0 text-[13px] text-[var(--fa-ink-3)]">
                Nothing yet — orders, staff, and schedule changes show up here.
              </p>
            ) : (
              <ul className="fa-act-feed">
                {activity.map((item) => (
                  <li key={`${item.at}-${item.title}`}>
                    <span
                      className={`fa-act-dot ${item.tone === 'brand' ? '' : `fa-${item.tone}`}`}
                    />
                    <div className="fa-act-body">
                      <b>{item.title}</b>
                      <span>{formatRelative(item.at)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Not in the redesign's dashboard, kept from the live app: the
              focused show's rings and sales mix, and the shortcuts to Awards
              and Show Manager — laid out as one more aside card. */}
          <div className="fa-aside-card">
            <h4>Rings &amp; sales</h4>
            <div className="fa-kv">
              <span className="fa-k">Rings</span>
              <span className="fa-v">{rings.length > 0 ? rings.join(', ') : 'None yet'}</span>
            </div>
            {inventory.map((row) => (
              <div key={row.name} className="fa-kv">
                <span className="fa-k">{row.name}</span>
                <span className="fa-v">
                  {row.qty}
                  {canViewMoney && ` · ${formatMoney(row.revenue)}`}
                  {canViewMoney && !row.settled && row.revenue > 0 && (
                    <span className="block text-[11px] font-normal text-[var(--fa-ink-3)]">
                      owed, not collected
                    </span>
                  )}
                </span>
              </div>
            ))}
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href={`/dashboard/shows/${showRef}`}
                prefetch={false}
                className="fa-btn fa-btn-ghost fa-btn-sm"
              >
                Open Show Manager →
              </Link>
              <Link
                href={`/dashboard/awards?show=${showRef}`}
                prefetch={false}
                className="fa-btn fa-btn-ghost fa-btn-sm"
              >
                Awards →
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
