import type { Metadata } from 'next';
import { listPublicShows } from '@/modules/shows/data/public-queries';
import { PublicShowsList } from '@/modules/shows/ui/public/public-shows-list';

export const metadata: Metadata = {
  title: 'Browse shows — Field & Arena',
  description: 'Every published show on Field & Arena — view details and enter.',
};

export default async function PublicShowsRoute() {
  const shows = await listPublicShows();
  return <PublicShowsList shows={shows} />;
}
