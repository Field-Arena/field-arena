import type { Metadata } from 'next';
import { getScheduleReviewData } from '@/modules/shows/data/setup-queries';
import { ShowManagerShell } from '@/modules/shows/ui/show-manager/show-manager-shell';
import { ReviewCard } from '@/modules/shows/ui/show-manager/review-card';
import { EmptyPanel } from '@/modules/staff/ui/workspace-page';
import { isUuid } from '@/shared/lib/utils';

export const metadata: Metadata = { title: 'Schedule / Review — Field & Arena' };

/**
 * Show Manager, Schedule / Review tab: /dashboard/shows/[showId]/schedule.
 *
 * One card, ported from showstaff.html's renderReviewView: every class on the
 * show, editable in place (arena, judges, fee), with a removal control and a
 * local-only entries-per-class projection. Reads the show directly rather
 * than through getOrganizerContext(showId), same as the other Show Manager
 * tabs — see setup's page.tsx for why.
 */
export default async function SchedulePage({
  params,
}: {
  params: Promise<{ showId: string }>;
}) {
  const { showId } = await params;
  const data = isUuid(showId) ? await getScheduleReviewData(showId) : null;

  if (!data) {
    return (
      <EmptyPanel
        title="Show not found"
        note="This show doesn't exist, or you don't have access to it."
      />
    );
  }

  return (
    <ShowManagerShell showId={data.showId} showName={data.showName} activeTab="Schedule / Review">
      <ReviewCard data={data} />
    </ShowManagerShell>
  );
}
