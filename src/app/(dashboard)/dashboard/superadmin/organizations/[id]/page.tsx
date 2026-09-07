import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getOrganizationShows } from '@/modules/superadmin/data/queries';
import { OrganizationShowsBoard } from '@/modules/superadmin/ui/organization-shows-board';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const org = await getOrganizationShows(id);
  return { title: org ? `${org.name} — Shows` : 'Organizer shows' };
}

export default async function OrganizationShowsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const org = await getOrganizationShows(id);
  if (!org) notFound();

  return <OrganizationShowsBoard org={org} />;
}
