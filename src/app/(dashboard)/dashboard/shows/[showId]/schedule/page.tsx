import type { Metadata } from 'next';
import {
  getMasterSchedule,
  getScheduleReviewData,
  listStaff,
} from '@/modules/shows/data/setup-queries';
import { getRunShowData } from '@/modules/shows/data/queries';
import { summarizeSchedule } from '@/modules/shows/schedule-summary';
import { ScheduleReviewSummary } from '@/modules/shows/ui/show-manager/schedule-review-summary';
import { ReviewCard } from '@/modules/shows/ui/show-manager/review-card';
import { EmptyPanel } from '@/shared/ui/workspace-page';
import { resolveShowIdParam } from '@/modules/shows/data/resolve-show-id';

export const metadata: Metadata = { title: 'Schedule / Review — Field & Arena' };

export default async function SchedulePage({ params }: { params: Promise<{ showId: string }> }) {
  const { showId } = await params;
  const id = await resolveShowIdParam(showId);
  const [data, master, run, staff] = id
    ? await Promise.all([
        getScheduleReviewData(id),
        getMasterSchedule(id),
        getRunShowData(id),
        listStaff(id),
      ])
    : [null, null, null, []];

  const officials = staff.filter((s) => s.role === 'Judge' || s.role === 'Scribe');

  if (!data || !id) {
    return (
      <EmptyPanel
        title="Show not found"
        note="This show doesn't exist, or you don't have access to it."
      />
    );
  }

  return (
    <>
      {master && run && (
        <ScheduleReviewSummary
          showId={id}
          publicId={showId}
          summary={summarizeSchedule(master.schedule, master.judgesByClass, master.startDate)}
          published={run.published}
          ticketClosed={run.runner.ticketClosed}
          approved={run.runner.approved}
          stage={run.stage}
          restGap={{
            same: master.rules.hardRuleSameHorseMin,
            diff: master.rules.hardRuleDiffHorseMin,
          }}
          officials={{
            total: officials.length,
            judges: officials.filter((s) => s.role === 'Judge').length,
            withAccess: officials.filter((s) => s.accepted).length,
          }}
        />
      )}
      <ReviewCard data={data} publicId={showId} />
    </>
  );
}
