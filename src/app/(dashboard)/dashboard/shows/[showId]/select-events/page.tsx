import type { Metadata } from 'next';
import { getSelectEventsData } from '@/modules/shows/data/setup-queries';
import { SelectEventsPicker } from '@/modules/shows/ui/show-manager/select-events-picker';
import { SectionFooter } from '@/modules/shows/ui/show-manager/section-footer';
import { EmptyPanel } from '@/modules/staff/ui/workspace-page';
import { resolveShowIdParam } from '@/modules/shows/data/resolve-show-id';

export const metadata: Metadata = { title: 'Select Events — Field & Arena' };

export default async function SelectEventsPage({
  params,
}: {
  params: Promise<{ showId: string }>;
}) {
  const { showId } = await params;
  const id = await resolveShowIdParam(showId);
  const data = id ? await getSelectEventsData(id) : null;

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
      <SelectEventsPicker data={data} />
      <SectionFooter
        currentTab="Select Events"
        showId={showId}
        blockedReason={
          data.classes.length === 0
            ? "You haven't selected any events yet — riders won't have anything to register for."
            : null
        }
      />
    </>
  );
}
