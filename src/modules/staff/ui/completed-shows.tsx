import Link from 'next/link';
import type { DashboardShowRow } from '@/modules/shows/types';

/** Finished shows collect here, most recent first, each with a way back
 * into its dashboard, results and awards. */
export function CompletedShows({ shows }: { shows: DashboardShowRow[] }) {
  return (
    <section>
      <div className="fa-page-head">
        <div>
          <h2>Completed shows</h2>
          <p>Shows that have ended or published their results.</p>
        </div>
      </div>

      {shows.length === 0 ? (
        <div className="fa-mini-card">
          <h4>No completed shows yet</h4>
          <p>Once a show ends, it moves here so your current shows stay up front.</p>
        </div>
      ) : (
        <div className="fa-aside-card">
          <ul className="m-0 list-none p-0">
            {shows.map((show) => {
              const ref = show.slug ?? show.id;
              return (
                <li
                  key={show.id}
                  className="flex flex-wrap items-center gap-3 border-b border-[var(--fa-line-soft)] py-3 last:border-b-0"
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/dashboard?show=${ref}`}
                      prefetch={false}
                      className="text-[14px] font-semibold text-[var(--fa-ink)] no-underline hover:text-[var(--fa-brand)]"
                    >
                      {show.name}
                    </Link>
                    <div className="text-[12.5px] text-[var(--fa-ink-3)]">
                      {[show.dateLabel, `${String(show.riderCount)} riders`]
                        .filter(Boolean)
                        .join(' · ')}
                    </div>
                  </div>
                  <Link
                    href={`/dashboard/shows/${ref}/results`}
                    prefetch={false}
                    className="fa-btn fa-btn-ghost fa-btn-sm"
                  >
                    Results
                  </Link>
                  <Link
                    href={`/dashboard/awards?show=${ref}`}
                    prefetch={false}
                    className="fa-btn fa-btn-ghost fa-btn-sm"
                  >
                    Awards
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
