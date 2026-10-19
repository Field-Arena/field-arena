import type { Metadata } from 'next';
import { getLiveResults, listMyShows, pickCurrentShow } from '@/modules/announcements/data/queries';
import { ShowSwitcher } from '@/modules/announcements/ui/show-switcher';
import { LiveResultsTable } from '@/modules/announcements/ui/live-results-table';
import { AnnouncerAutoRefresh } from '@/modules/announcements/ui/announcer-auto-refresh';
import { EmptyState, LiveDot, PageHeader } from '@/shared/ui/organizer/fa-page';

export const metadata: Metadata = { title: 'Results — Live — Field & Arena' };

export default async function AnnouncingResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const { show: requestedShowId } = await searchParams;
  const shows = await listMyShows();
  const currentShow = pickCurrentShow(shows, requestedShowId);

  if (!currentShow) {
    return (
      <>
        <PageHeader
          eyebrow="Every rider's score, the moment it's confirmed — class by class"
          title="Results — Live"
        />
        <EmptyState
          title="No shows assigned"
          note="You are not staffed as an announcer on any show yet. An organizer adds an announcer from ShowManager."
        />
      </>
    );
  }

  const results = await getLiveResults(currentShow.id);

  return (
    <>
      <AnnouncerAutoRefresh />
      <PageHeader
        eyebrow={
          <span className="inline-flex items-center gap-2">
            <LiveDot />
            Every rider&apos;s score, the moment it&apos;s confirmed — class by class
          </span>
        }
        title="Results — Live"
        actions={<ShowSwitcher currentShow={currentShow} shows={shows} />}
      />
      <LiveResultsTable results={results} />
    </>
  );
}
