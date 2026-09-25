import type { Metadata } from 'next';
import { getRunShowData } from '@/modules/shows/data/queries';
import { getTicketWindowData } from '@/modules/shows/data/setup-queries';
import { RunShowCard } from '@/modules/shows/ui/show-manager/run-show-card';
import { TicketWindowCard } from '@/modules/shows/ui/show-manager/ticket-window-card';
import { EmptyPanel } from '@/modules/staff/ui/workspace-page';
import { resolveShowIdParam } from '@/modules/shows/data/resolve-show-id';

export const metadata: Metadata = { title: 'Run Show — Field & Arena' };

export default async function RunShowPage({ params }: { params: Promise<{ showId: string }> }) {
  const { showId } = await params;
  const id = await resolveShowIdParam(showId);
  const [data, ticketWindow] = await Promise.all([
    id ? getRunShowData(id) : Promise.resolve(null),
    id ? getTicketWindowData(id) : Promise.resolve(null),
  ]);

  if (!data) {
    return (
      <EmptyPanel
        title="Show not found"
        note="This show doesn't exist, or you don't have access to it."
      />
    );
  }

  return (
    <>
      {ticketWindow && <TicketWindowCard data={ticketWindow} />}
      <RunShowCard data={data} />
    </>
  );
}
