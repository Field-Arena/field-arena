import type { Metadata } from 'next';
import Link from 'next/link';
import { listMyAssignments, getClassPlacings } from '@/modules/judging/data/queries';
import { isAssignmentComplete } from '@/modules/judging/utils/is-assignment-complete';
import { PlacingsTable } from '@/modules/judging/ui/placings-table';
import { Card, ScreenLede, ScreenTitle } from '@/shared/ui/organizer/card';

export const metadata: Metadata = { title: 'Results — Field & Arena' };

export default async function JudgingResultsPage() {
  const assignments = await listMyAssignments();
  const done = assignments.filter(isAssignmentComplete);

  const placingsByClass = await Promise.all(
    done.map(async (a) => ({ classId: a.classId, ...(await getClassPlacings(a.classId)) })),
  );

  return (
    <>
      <div className="mb-[22px]">
        <Link
          href="/dashboard/judging"
          className="hover:text-gold mb-2 inline-block text-[13px] font-semibold text-[#5A6B63]"
        >
          ← Back to My Assignments
        </Link>
        <ScreenTitle>Results</ScreenTitle>
        <ScreenLede className="mb-0">Placings for classes you&apos;ve completed.</ScreenLede>
      </div>

      {done.length === 0 ? (
        <Card className="p-[60px_20px] text-center text-[14.5px] text-[#7A8781]">
          No completed classes yet.
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          {placingsByClass.map((cls) => (
            <div key={cls.classId}>
              <h3 className="text-ink-deep mb-2 font-[Newsreader,serif] text-[17px] font-semibold">
                {cls.className}
              </h3>
              <Card className="p-[16px_18px]">
                <PlacingsTable entries={cls.entries} />
              </Card>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
