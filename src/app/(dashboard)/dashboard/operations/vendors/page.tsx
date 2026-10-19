import type { Metadata } from 'next';
import { getMyPermissions, listMyShows, listVendors } from '@/modules/operations/data/queries';
import { VendorsPanel } from '@/modules/operations/ui/vendors-panel';
import { OPS_WRAP, OpsNoShows } from '@/modules/operations/ui/ops-page';
import { PageHeader } from '@/shared/ui/organizer/fa-page';
import { FaShowSelect } from '@/shared/ui/organizer/fa-show-select';

export const metadata: Metadata = { title: 'Vendors — Field & Arena' };

export default async function OperationsVendorsPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const { show: requestedShowId } = await searchParams;
  const shows = await listMyShows();
  const currentShow =
    shows.find((s) => s.id === requestedShowId || s.slug === requestedShowId) ?? shows[0] ?? null;

  if (!currentShow) {
    return <OpsNoShows eyebrow="Vendor booths and contacts on-site" title="Vendors" />;
  }

  const permissions = await getMyPermissions(currentShow.id);
  const vendors = permissions.canViewMoney ? await listVendors(currentShow.id) : [];

  return (
    <div className={OPS_WRAP}>
      <PageHeader
        eyebrow={`Vendor booths and contacts on-site · ${currentShow.name}`}
        title="Vendors"
        actions={<FaShowSelect shows={shows} currentRef={currentShow.slug ?? currentShow.id} />}
      />
      <VendorsPanel vendors={vendors} canViewVendors={permissions.canViewMoney} />
    </div>
  );
}
