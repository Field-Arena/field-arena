import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getShowRoster } from '@/modules/superadmin/data/queries';
import { ShowRosterBoard } from '@/modules/superadmin/ui/show-roster-board';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ showId: string }>;
}): Promise<Metadata> {
  const { showId } = await params;
  const roster = await getShowRoster(showId);
  return { title: roster ? `${roster.showName} — Riders` : 'Riders' };
}

export default async function ShowRosterPage({
  params,
}: {
  params: Promise<{ id: string; showId: string }>;
}) {
  const { id, showId } = await params;
  const roster = await getShowRoster(showId);
  if (!roster) notFound();

  return <ShowRosterBoard orgId={id} showId={showId} roster={roster} />;
}
