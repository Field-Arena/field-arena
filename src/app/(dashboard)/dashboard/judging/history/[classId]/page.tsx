import type { Metadata } from 'next';
import Link from 'next/link';
import { getClassPlacings } from '@/modules/judging/data/queries';
import { PlacingsTable } from '@/modules/judging/ui/placings-table';
import { PageHeader } from '@/shared/ui/organizer/fa-page';

export const metadata: Metadata = { title: 'Placings — Field & Arena' };

export default async function HistoryClassPlacingsPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;
  const { className, entries } = await getClassPlacings(classId);

  return (
    <>
      <Link
        href="/dashboard/judging/history"
        prefetch={false}
        className="mb-1 inline-block text-[13px] font-semibold text-[#5A6B63] no-underline hover:text-[#1A5B3C]"
      >
        ← Back to History
      </Link>
      <PageHeader eyebrow="Final placings for this class" title={className} />

      <PlacingsTable entries={entries} linkBase={`/dashboard/judging/history/${classId}`} />
    </>
  );
}
