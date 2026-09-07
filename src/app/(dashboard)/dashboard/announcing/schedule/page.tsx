import type { Metadata } from 'next';
import { listMyShows, listShowSchedule, pickCurrentShow } from '@/modules/announcements/data/queries';
import { ShowSwitcher } from '@/modules/announcements/ui/show-switcher';
import { ShowScheduleTable } from '@/modules/announcements/ui/show-schedule-table';
import { EmptyPanel } from '@/modules/staff/ui/workspace-page';

export const metadata: Metadata = { title: 'Schedule — Field & Arena' };

export default async function AnnouncingSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const { show: requestedShowId } = await searchParams;
  const shows = await listMyShows();
  const currentShow = pickCurrentShow(shows, requestedShowId);

  const head = (
    <div className="dash-head">
      <div>
        <h1>Schedule</h1>
        <p>Ring times for this show, class by class.</p>
      </div>
    </div>
  );

  if (!currentShow) {
    return (
      <>
        {head}
        <div className="dash-card">
          <EmptyPanel
            title="No shows assigned"
            note="You are not staffed as an announcer on any show yet. An organizer adds an announcer from ShowManager."
          />
        </div>
      </>
    );
  }

  const schedule = await listShowSchedule(currentShow.id);

  return (
    <>
      {head}
      <div className="dash-card">
        <ShowSwitcher currentShow={currentShow} shows={shows} />
        <ShowScheduleTable schedule={schedule} />
      </div>
    </>
  );
}
