import type { Metadata } from 'next';
import { listMyShows, listStabling } from '@/modules/operations/data/queries';
import { StablingPanel } from '@/modules/operations/ui/stabling-panel';
import { OPS_WRAP, OpsNoShows } from '@/modules/operations/ui/ops-page';
import { PageHeader } from '@/shared/ui/organizer/fa-page';
import { FaShowSelect } from '@/shared/ui/organizer/fa-show-select';

export const metadata: Metadata = { title: 'Stabling — Field & Arena' };

export default async function OperationsStablingPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const { show: requestedShowId } = await searchParams;
  const shows = await listMyShows();
  const currentShow =
    shows.find((s) => s.id === requestedShowId || s.slug === requestedShowId) ?? shows[0] ?? null;

  if (!currentShow) {
    return <OpsNoShows eyebrow="Stall assignments and arrivals" title="Stabling" />;
  }

  const stabling = await listStabling(currentShow.id);

  return (
    <div className={OPS_WRAP}>
      <PageHeader
        eyebrow={`Stall assignments and arrivals · ${currentShow.name}`}
        title="Stabling"
        actions={<FaShowSelect shows={shows} currentRef={currentShow.slug ?? currentShow.id} />}
      />
      <StablingPanel stabling={stabling} />
    </div>
  );
}
