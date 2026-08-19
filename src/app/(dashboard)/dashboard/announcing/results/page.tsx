import type { Metadata } from 'next';
import { getLiveResults, listMyShows } from '@/modules/announcements/data/queries';
import { ShowSwitcher } from '@/modules/announcements/ui/show-switcher';
import { LiveResultsTable } from '@/modules/announcements/ui/live-results-table';
import { EmptyPanel } from '@/modules/staff/ui/workspace-page';

export const metadata: Metadata = { title: 'Results — Live — Field & Arena' };

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
