import type { Metadata } from 'next';
import { getRingStatus, listMyShows, pickCurrentShow } from '@/modules/announcements/data/queries';
import { ShowSwitcher } from '@/modules/announcements/ui/show-switcher';
import { ActiveRingsPanel } from '@/modules/announcements/ui/active-rings-panel';
import { AllRingsTable } from '@/modules/announcements/ui/all-rings-table';
import { ANNOUNCING_RESULTS_PATH } from '@/modules/announcements/constants';
import { AnnouncerAutoRefresh } from '@/modules/announcements/ui/announcer-auto-refresh';
import { EmptyState, FA_BTN_PRIMARY, LiveDot, PageHeader } from '@/shared/ui/organizer/fa-page';

export const metadata: Metadata = { title: 'Up Next — Field & Arena' };

const LIVE_EYEBROW = (
  <span className="inline-flex items-center gap-2">
    <LiveDot />
    Live · auto-updates
  </span>
);

export default async function AnnouncingPage({
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
        <PageHeader eyebrow="Ring status, running order and live results" title="Up Next" />
        <EmptyState
          title="No shows assigned"
          note="You are not staffed as an announcer on any show yet. An organizer adds an announcer from ShowManager."
        />
      </>
    );
  }

  const rings = await getRingStatus(currentShow.id);
  const liveRings = rings.filter((r) => r.scoringOpen);

  return (
    <>
      <AnnouncerAutoRefresh />
      <PageHeader
        eyebrow={LIVE_EYEBROW}
        title="Up Next"
        actions={
          <>
            <ShowSwitcher currentShow={currentShow} shows={shows} />
            <a
              href={`${ANNOUNCING_RESULTS_PATH}?show=${currentShow.slug ?? currentShow.id}`}
              className={FA_BTN_PRIMARY}
            >
              View results — live →
            </a>
          </>
        }
      />

      <ActiveRingsPanel liveRings={liveRings} />
      <AllRingsTable rings={rings} />
    </>
  );
}
