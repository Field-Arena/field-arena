import type { Metadata } from 'next';
import { listMyShows, listSchedule } from '@/modules/operations/data/queries';
import { ScheduleList } from '@/modules/operations/ui/schedule-list';
import { OPS_WRAP, OpsNoShows } from '@/modules/operations/ui/ops-page';
import { PageHeader } from '@/shared/ui/organizer/fa-page';
import { FaShowSelect } from '@/shared/ui/organizer/fa-show-select';

export const metadata: Metadata = { title: 'Schedule — Field & Arena' };

export default async function OperationsSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const { show: requestedShowId } = await searchParams;
  const shows = await listMyShows();
  const currentShow =
    shows.find((s) => s.id === requestedShowId || s.slug === requestedShowId) ?? shows[0] ?? null;

  if (!currentShow) {
    return <OpsNoShows eyebrow="The full ring-by-ring running order" title="Schedule" />;
  }

  const classes = await listSchedule(currentShow.id);

  return (
    <div className={OPS_WRAP}>
      <PageHeader
        eyebrow={`The full ring-by-ring running order · ${currentShow.name}`}
        title="Schedule"
        actions={<FaShowSelect shows={shows} currentRef={currentShow.slug ?? currentShow.id} />}
      />
      <ScheduleList classes={classes} />
    </div>
  );
}
