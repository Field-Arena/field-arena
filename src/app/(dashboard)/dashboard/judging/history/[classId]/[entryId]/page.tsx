import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getEntryScorecard } from '@/modules/judging/data/queries';
import { Card, ScreenLede, ScreenTitle } from '@/shared/ui/organizer/card';
import { MovementsMarksTable } from '@/modules/judging/ui/movements-marks-table';
import { CollectivesMarksTable } from '@/modules/judging/ui/collectives-marks-table';

export const metadata: Metadata = { title: 'Scorecard — Field & Arena' };

/**
 * History drill-down, level 3: one rider's full per-movement scorecard,
 * marks averaged across every seat that scored them. Ported from
 * judge-scribe.html's `historyView()` rider-detail state.
 */
export default async function HistoryScorecardPage({
  params,
}: {
  params: Promise<{ classId: string; entryId: string }>;
}) {
  const { classId, entryId } = await params;
  const card = await getEntryScorecard(entryId);
  if (!card) notFound();

  return (
    <>
      <div className="mb-[22px]">
        <Link
          href={`/dashboard/judging/history/${classId}`}
          className="mb-2 inline-block text-[13px] font-semibold text-[#5A6B63] hover:text-gold"
        >
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
        <Card className="p-[24px_20px] text-[13.5px] text-[#7A8781]">No test definition on file for this ride.</Card>
      ) : (
        <div className="flex flex-col gap-4">
          <MovementsMarksTable
            movements={card.test.movements}
            marks={card.movementMarks}
            remarks={card.movementRemarks}
          />

          {card.test.collectives.length > 0 && (
            <CollectivesMarksTable collectives={card.test.collectives} marks={card.collectiveMarks} />
          )}
        </div>
      )}
    </>
  );
}
