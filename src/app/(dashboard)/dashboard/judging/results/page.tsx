import type { Metadata } from 'next';
import Link from 'next/link';
import { listMyAssignments, getClassPlacings } from '@/modules/judging/data/queries';
import { isAssignmentComplete } from '@/modules/judging/utils';
import { PlacingsTable } from '@/modules/judging/ui/placings-table';
import { Card, ScreenLede, ScreenTitle } from '@/shared/ui/organizer/card';

export const metadata: Metadata = { title: 'Results — Field & Arena' };

/**
 * Every completed class this judge/scribe is on the panel for, with its
 * placings shown inline — ported from judge-scribe.html's `resultsView()`.
 * "Complete" means every entry has been scored, scratched, or disqualified
 * (`isAssignmentComplete`), not just today's classes — legacy's own filter
 * has no date restriction either, only the nav button's visibility does.
 */
export default async function JudgingResultsPage() {
  const assignments = await listMyAssignments();
  const done = assignments.filter(isAssignmentComplete);

  const placingsByClass = await Promise.all(
    done.map(async (a) => ({ classId: a.classId, ...(await getClassPlacings(a.classId)) }))
  );

  return (
    <>
      <div className="mb-[22px]">
        <Link
          href="/dashboard/judging"
          className="mb-2 inline-block text-[13px] font-semibold text-[#5A6B63] hover:text-gold"
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
              <h3 className="mb-2 font-[Newsreader,serif] text-[17px] font-semibold text-ink-deep">
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
