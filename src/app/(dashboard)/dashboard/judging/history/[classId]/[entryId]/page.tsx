import type { Metadata } from 'next';
import { ensureClassShowParam } from '@/modules/shows/data/class-show-ref';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getEntryScorecard } from '@/modules/judging/data/queries';
import { Card, ScreenLede, ScreenTitle } from '@/shared/ui/organizer/card';
import { MovementsMarksTable } from '@/modules/judging/ui/movements-marks-table';
import { CollectivesMarksTable } from '@/modules/judging/ui/collectives-marks-table';

export const metadata: Metadata = { title: 'Scorecard — Field & Arena' };

export default async function HistoryScorecardPage({
  params,
  searchParams,
}: {
  params: Promise<{ classId: string; entryId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { classId, entryId } = await params;
  // Keep the topbar show picker on this class's show, not the org default.
  await ensureClassShowParam(
    `/dashboard/judging/history/${classId}/${entryId}`,
    classId,
    await searchParams,
  );
  const card = await getEntryScorecard(entryId);
  if (!card) notFound();

  return (
    <>
      <div className="mb-[22px]">
        <Link href={`/dashboard/judging/history/${classId}`} className="fa-backlink !mb-2">
          ← Back to placings
        </Link>
        <ScreenTitle>
          #{card.num} {card.rider}
        </ScreenTitle>
        <ScreenLede className="mb-0">
          {card.horse} · {card.className} · Final score: {card.finalPct ?? '—'}
        </ScreenLede>
      </div>

      {!card.test ? (
        <Card className="p-[24px_20px] text-[13.5px] text-[#8A94A3]">
          No test definition on file for this ride.
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          <MovementsMarksTable
            movements={card.test.movements}
            marks={card.movementMarks}
            remarks={card.movementRemarks}
          />

          {card.test.collectives.length > 0 && (
            <CollectivesMarksTable
              collectives={card.test.collectives}
              marks={card.collectiveMarks}
            />
          )}
        </div>
      )}
    </>
  );
}
