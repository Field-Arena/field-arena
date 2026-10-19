import type { Metadata } from 'next';
import {
  listMyShows,
  listShowSchedule,
  pickCurrentShow,
} from '@/modules/announcements/data/queries';
import { ShowSwitcher } from '@/modules/announcements/ui/show-switcher';
import { ShowScheduleTable } from '@/modules/announcements/ui/show-schedule-table';
import { EmptyState, PageHeader } from '@/shared/ui/organizer/fa-page';

export const metadata: Metadata = { title: 'Schedule — Field & Arena' };

export default async function AnnouncingSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const { show: requestedShowId } = await searchParams;
  const shows = await listMyShows();
  const currentShow = pickCurrentShow(shows, requestedShowId);

  const head = <PageHeader eyebrow="Ring times for this show, class by class" title="Schedule" />;

  if (!currentShow) {
    return (
      <>
        {head}
        <EmptyState
          title="No shows assigned"
          note="You are not staffed as an announcer on any show yet. An organizer adds an announcer from ShowManager."
        />
      </>
    );
  }

  const schedule = await listShowSchedule(currentShow.id);

  return (
    <>
      <PageHeader
        eyebrow="Ring times for this show, class by class"
        title="Schedule"
        actions={<ShowSwitcher currentShow={currentShow} shows={shows} />}
      />
      <ShowScheduleTable schedule={schedule} />
    </>
  );
}
