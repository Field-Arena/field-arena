import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isUuid } from '@/shared/lib/utils';
import { getPublicShowPage } from '@/modules/shows/data/public-queries';
import { PublicShowPage } from '@/modules/shows/ui/public/public-show-page';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ showId: string }>;
}): Promise<Metadata> {
  const { showId } = await params;
  if (!isUuid(showId)) return { title: 'Show — Field & Arena' };
  const show = await getPublicShowPage(showId);
  if (!show) return { title: 'Show — Field & Arena' };
  return {
    title: `${show.name} — Field & Arena`,
    description: `${show.name}${show.orgName ? ` · ${show.orgName}` : ''} — view classes and enter on Field & Arena.`,
  };
}

export default async function PublicShowRoute({
  params,
}: {
  params: Promise<{ showId: string }>;
}) {
  const { showId } = await params;
  if (!isUuid(showId)) notFound();

  const show = await getPublicShowPage(showId);
  if (!show) notFound();

  return <PublicShowPage data={show} />;
}
