import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getEntryScorecard } from '@/modules/judging/data/queries';
import { EmptyState, PageHeader } from '@/shared/ui/organizer/fa-page';
import { MovementsMarksTable } from '@/modules/judging/ui/movements-marks-table';
import { CollectivesMarksTable } from '@/modules/judging/ui/collectives-marks-table';

export const metadata: Metadata = { title: 'Scorecard — Field & Arena' };

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
      <Link
        href={`/dashboard/judging/history/${classId}`}
        prefetch={false}
        className="mb-1 inline-block text-[13px] font-semibold text-[#5A6B63] no-underline hover:text-[#1A5B3C]"
      >
        ← Back to placings
      </Link>
      <PageHeader
        eyebrow={
          <>
            {card.horse} · {card.className} · Final score: {card.finalPct ?? '—'}
          </>
        }
        title={
          <>
            #{card.num} {card.rider}
          </>
        }
      />

      {!card.test ? (
        <EmptyState title="No test definition on file for this ride." />
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
