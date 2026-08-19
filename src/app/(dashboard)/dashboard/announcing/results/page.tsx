import type { Metadata } from 'next';
import { getLiveResults, listMyShows } from '@/modules/announcements/data/queries';
import { ShowSwitcher } from '@/modules/announcements/ui/show-switcher';
import { LiveResultsTable } from '@/modules/announcements/ui/live-results-table';
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
        <ShowSwitcher currentShow={currentShow} shows={shows} />
        <LiveResultsTable results={results} />
      </div>
    </>
  );
}
