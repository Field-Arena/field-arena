import type { Metadata } from 'next';
import { ensureClassShowParam } from '@/modules/shows/data/class-show-ref';
import Link from 'next/link';
import { getClassPlacings } from '@/modules/judging/data/queries';
import { PlacingsTable } from '@/modules/judging/ui/placings-table';
import { PageHeader } from '@/shared/ui/organizer/fa-page';

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
