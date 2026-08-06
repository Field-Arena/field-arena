import type { Metadata } from 'next';
import Link from 'next/link';
import { getClassPlacings } from '@/modules/judging/data/queries';
import { PlacingsTable } from '@/modules/judging/ui/placings-table';
import { Card, ScreenLede, ScreenTitle } from '@/shared/ui/organizer/card';

export const metadata: Metadata = { title: 'Placings — Field & Arena' };

/**
 * History drill-down, level 2: one completed class's placings, each row
 * linking to that rider's full scorecard (level 3). Ported from
 * judge-scribe.html's `historyView()` event-detail state.
 */
export default async function HistoryClassPlacingsPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;
  const { className, entries } = await getClassPlacings(classId);

  return (
    <>
      <div className="mb-[22px]">
        <Link
          href="/dashboard/judging/history"
          className="mb-2 inline-block text-[13px] font-semibold text-[#5A6B63] hover:text-gold"
        >
          ← Back to History
        </Link>
        <ScreenTitle>{className}</ScreenTitle>
        <ScreenLede className="mb-0">Final placings for this class.</ScreenLede>
      </div>

      <Card className="p-[16px_18px]">
        <PlacingsTable entries={entries} linkBase={`/dashboard/judging/history/${classId}`} />
      </Card>
    </>
  );
}
