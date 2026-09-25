import type { Metadata } from 'next';
import { getScheduleReviewData } from '@/modules/shows/data/setup-queries';
import { ReviewCard } from '@/modules/shows/ui/show-manager/review-card';
import { EmptyPanel } from '@/modules/staff/ui/workspace-page';
import { resolveShowIdParam } from '@/modules/shows/data/resolve-show-id';

export const metadata: Metadata = { title: 'Schedule / Review — Field & Arena' };

export default async function SchedulePage({ params }: { params: Promise<{ showId: string }> }) {
  const { showId } = await params;
  const id = await resolveShowIdParam(showId);
  const data = id ? await getScheduleReviewData(id) : null;

  if (!data) {
    return (
      <EmptyPanel
        title="Show not found"
        note="This show doesn't exist, or you don't have access to it."
      />
    );
  }

  return <ReviewCard data={data} publicId={showId} />;
}
