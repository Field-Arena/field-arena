import type { Metadata } from 'next';
import { getRiderEntriesData } from '@/modules/shows/data/setup-queries';
import { RiderEntriesPanel } from '@/modules/shows/ui/show-manager/rider-entries-panel';
import { EmptyPanel } from '@/modules/staff/ui/workspace-page';
import { resolveShowIdParam } from '@/modules/shows/data/resolve-show-id';

export const metadata: Metadata = { title: 'Rider Entries — Field & Arena' };

export default async function RiderEntriesPage({
  params,
}: {
  params: Promise<{ showId: string }>;
}) {
  const { showId } = await params;
  const id = await resolveShowIdParam(showId);
  const data = id ? await getRiderEntriesData(id) : null;

  if (!data) {
    return (
      <EmptyPanel
        title="Show not found"
        note="This show doesn't exist, or you don't have access to it."
      />
    );
  }

  return <RiderEntriesPanel data={data} publicId={showId} />;
}
