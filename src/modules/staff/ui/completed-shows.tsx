import Link from 'next/link';
import type { DashboardShowRow } from '@/modules/shows/types';
import {
  CardTitle,
  EmptyState,
  FA_BTN_SMALL,
  FA_MUTED,
  FaCard,
  PageHeader,
} from '@/shared/ui/organizer/fa-page';

/** Finished shows collect here, most recent first, each with a way back
 * into its dashboard, results and awards. */
export function CompletedShows({ shows }: { shows: DashboardShowRow[] }) {
  return (
    <section className="text-ink-deep font-[family-name:var(--font-ar)]">
      <PageHeader
        eyebrow="Shows that have ended or published their results"
        title="Completed shows"
      />

      {shows.length === 0 ? (
        <EmptyState
          title="No completed shows yet"
          note="Once a show ends, it moves here so your current shows stay up front."
        />
      ) : (
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {shows.map((show) => {
            const ref = show.slug ?? show.id;
            return (
              <li key={show.id}>
                <FaCard className="flex flex-wrap items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/dashboard?show=${ref}`}
                      prefetch={false}
                      className="no-underline hover:underline"
                    >
                      <CardTitle>{show.name}</CardTitle>
                    </Link>
                    <p className={FA_MUTED}>
                      {[
                        show.dateLabel,
                        show.riderCount === null ? null : `${String(show.riderCount)} riders`,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>
                  <Link
                    href={`/dashboard/shows/${ref}/results`}
                    prefetch={false}
                    className={FA_BTN_SMALL}
                  >
                    Results
                  </Link>
                  <Link
                    href={`/dashboard/awards?show=${ref}`}
                    prefetch={false}
                    className={FA_BTN_SMALL}
                  >
                    Awards
                  </Link>
                </FaCard>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
