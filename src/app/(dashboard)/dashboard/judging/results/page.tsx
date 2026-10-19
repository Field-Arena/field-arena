import type { Metadata } from 'next';
import Link from 'next/link';
import { listMyAssignments, getClassPlacings } from '@/modules/judging/data/queries';
import { isAssignmentComplete } from '@/modules/judging/utils/is-assignment-complete';
import { PlacingsTable } from '@/modules/judging/ui/placings-table';
import { CardTitle, EmptyState, FaCard, PageHeader } from '@/shared/ui/organizer/fa-page';

export const metadata: Metadata = { title: 'Results — Field & Arena' };

export default async function JudgingResultsPage() {
  const assignments = await listMyAssignments();
  const done = assignments.filter(isAssignmentComplete);

  const placingsByClass = await Promise.all(
    done.map(async (a) => ({ classId: a.classId, ...(await getClassPlacings(a.classId)) })),
  );

  return (
    <>
      <BackLink />
      <PageHeader eyebrow="Placings for classes you've completed" title="Results" />

      {done.length === 0 ? (
        <EmptyState title="No completed classes yet." />
      ) : (
        <div className="flex flex-col gap-3">
          {placingsByClass.map((cls) => (
            <FaCard key={cls.classId}>
              <CardTitle className="mb-3">{cls.className}</CardTitle>
              <PlacingsTable entries={cls.entries} />
            </FaCard>
          ))}
        </div>
      )}
    </>
  );
}

function BackLink() {
  return (
    <Link
      href="/dashboard/judging"
      prefetch={false}
      className="mb-1 inline-block text-[13px] font-semibold text-[#5A6B63] no-underline hover:text-[#1A5B3C]"
    >
      ← Back to My Assignments
    </Link>
  );
}
