import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { resolveShowIdParam } from '@/modules/shows/data/resolve-show-id';
import { getPublicShowPage } from '@/modules/shows/data/public-queries';
import { PublicShowPage } from '@/modules/shows/ui/public/public-show-page';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ showId: string }>;
}): Promise<Metadata> {
  const { showId } = await params;
  const id = await resolveShowIdParam(showId);
  if (!id) return { title: 'Show — Field & Arena' };
  const show = await getPublicShowPage(id);
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
  const id = await resolveShowIdParam(showId);
  if (!id) notFound();

  const show = await getPublicShowPage(id);
  if (!show) notFound();

  return <PublicShowPage data={show} />;
}
