import type { Metadata } from 'next';
import {
  getMyPermissions,
  listHorsesDirectory,
  listMyShows,
  listRidersDirectory,
  listVendors,
} from '@/modules/operations/data/queries';
import { FindPanel } from '@/modules/operations/ui/find-panel';
import { OPS_WRAP, OpsNoShows } from '@/modules/operations/ui/ops-page';
import { PageHeader } from '@/shared/ui/organizer/fa-page';
import { FaShowSelect } from '@/shared/ui/organizer/fa-show-select';

export const metadata: Metadata = { title: 'Find — Field & Arena' };

export default async function OperationsFindPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const { show: requestedShowId } = await searchParams;
  const shows = await listMyShows();
  const currentShow =
    shows.find((s) => s.id === requestedShowId || s.slug === requestedShowId) ?? shows[0] ?? null;

  if (!currentShow) {
    return <OpsNoShows eyebrow="Look up a rider, horse, or vendor" title="Find" />;
  }

  const [riders, horses, permissions] = await Promise.all([
    listRidersDirectory(currentShow.id),
    listHorsesDirectory(currentShow.id),
    getMyPermissions(currentShow.id),
  ]);

  const vendors = permissions.canViewMoney ? await listVendors(currentShow.id) : [];

  return (
    <div className={OPS_WRAP}>
      <PageHeader
        eyebrow={`Look up a rider, horse, or vendor · ${currentShow.name}`}
        title="Find"
        actions={<FaShowSelect shows={shows} currentRef={currentShow.slug ?? currentShow.id} />}
      />
      <FindPanel
        riders={riders}
        horses={horses}
        vendors={vendors}
        canViewVendors={permissions.canViewMoney}
      />
    </div>
  );
}
