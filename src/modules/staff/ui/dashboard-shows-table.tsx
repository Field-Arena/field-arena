import Link from 'next/link';
import type { DashboardShowRow } from '@/modules/shows/types';

const STAGE: Record<string, { label: string; badge: string }> = {
  setup: { label: 'Draft', badge: 'fa-stub' },
  'sales-open': { label: 'On sale', badge: 'fa-pass' },
  'sales-closed': { label: 'Sales closed', badge: 'fa-pending' },
  live: { label: 'Live', badge: 'fa-live' },
  complete: { label: 'Complete', badge: 'fa-onboard' },
};

export function DashboardShowsTable({
  shows,
  focusedShowId,
}: {
  shows: DashboardShowRow[];
  focusedShowId?: string | null;
}) {
  return (
    <div className="fa-card">
      <div className="fa-card-head">
        <div>
          <h3>Your shows</h3>
          <div className="fa-sub">Pick one to focus the whole workspace on it</div>
        </div>
        <Link href="/dashboard/shows" prefetch={false} className="fa-btn fa-btn-ghost fa-btn-sm">
          Show Manager →
        </Link>
      </div>

      {shows.length === 0 ? (
        <p className="px-5 py-8 text-center text-[13.5px] text-[var(--fa-ink-3)]">
          No shows yet — create one to see it here.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="fa-table min-w-[560px]">
            <thead>
              <tr>
                <th>Show</th>
                <th>Dates</th>
                <th>Stage</th>
                <th className="fa-num">Riders</th>
                <th className="!text-right" aria-label="Action" />
              </tr>
            </thead>
            <tbody>
              {shows.map((show) => {
                const stage = STAGE[show.stage] ?? { label: show.stage, badge: 'fa-stub' };
                const ref = show.slug ?? show.id;
                const focused = show.id === focusedShowId;
                return (
                  <tr key={show.id}>
                    <td>
                      <Link
                        href={`/dashboard?show=${ref}`}
                        prefetch={false}
                        className="fa-show-name no-underline hover:text-[var(--fa-brand)]"
                      >
                        {show.name}
                      </Link>
                      {focused && <div className="fa-org-loc">Focused</div>}
                    </td>
                    <td>{show.dateLabel ?? 'TBD'}</td>
                    <td>
                      <span className={`fa-badge ${stage.badge}`}>
                        <span className="fa-dot" />
                        {stage.label}
                      </span>
                    </td>
                    <td className="fa-num">{show.riderCount}</td>
                    <td className="text-right">
                      <Link
                        href={
                          show.stage === 'setup'
                            ? `/dashboard/shows/${ref}`
                            : `/dashboard/schedule?show=${ref}`
                        }
                        prefetch={false}
                        className="fa-filelink"
                      >
                        {show.stage === 'setup' ? 'Set up →' : 'Schedule →'}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
