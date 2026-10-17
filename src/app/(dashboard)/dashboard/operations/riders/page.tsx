import type { Metadata } from 'next';
import { listMyShows, listRidersDirectory } from '@/modules/operations/data/queries';
import { RidersPanel } from '@/modules/operations/ui/riders-panel';
import { OPS_WRAP, OpsNoShows } from '@/modules/operations/ui/ops-page';
import { PageHeader } from '@/shared/ui/organizer/fa-page';
import { FaShowSelect } from '@/shared/ui/organizer/fa-show-select';

export const metadata: Metadata = { title: 'Riders — Field & Arena' };

export default async function OperationsRidersPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const { show: requestedShowId } = await searchParams;
  const shows = await listMyShows();
  const currentShow =
    shows.find((s) => s.id === requestedShowId || s.slug === requestedShowId) ?? shows[0] ?? null;

  if (!currentShow) {
    return <OpsNoShows eyebrow="Every rider entered in this show" title="Riders" />;
  }

  const riders = await listRidersDirectory(currentShow.id);

  return (
    <div className={OPS_WRAP}>
      <PageHeader
        eyebrow={`Every rider entered in ${currentShow.name}`}
        title="Riders"
        actions={<FaShowSelect shows={shows} currentRef={currentShow.slug ?? currentShow.id} />}
      />
      <RidersPanel riders={riders} />
    </div>
  );
}
