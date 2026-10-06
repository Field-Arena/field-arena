import type { Metadata } from 'next';
import { ensureClassShowParam } from '@/modules/shows/data/class-show-ref';
import Link from 'next/link';
import { getClassPlacings } from '@/modules/judging/data/queries';
import { PlacingsTable } from '@/modules/judging/ui/placings-table';
import { Card, ScreenLede, ScreenTitle } from '@/shared/ui/organizer/card';

export const metadata: Metadata = { title: 'Placings — Field & Arena' };

export default async function HistoryClassPlacingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ classId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { classId } = await params;
  // Keep the topbar show picker on this class's show, not the org default.
  await ensureClassShowParam(`/dashboard/judging/history/${classId}`, classId, await searchParams);
  const { className, entries } = await getClassPlacings(classId);

  return (
    <>
      <div className="mb-[22px]">
        <Link href="/dashboard/judging/history" className="fa-backlink !mb-2">
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
