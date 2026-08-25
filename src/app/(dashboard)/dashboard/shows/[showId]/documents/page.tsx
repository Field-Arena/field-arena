import type { Metadata } from 'next';
import { getDocumentsPageData } from '@/modules/shows/data/setup-queries';
import { ShowManagerShell } from '@/modules/shows/ui/show-manager/show-manager-shell';
import { DocumentsCard } from '@/modules/shows/ui/show-manager/documents-card';
import { EmptyPanel } from '@/modules/staff/ui/workspace-page';
import { isUuid } from '@/shared/lib/utils';
import { getOrganizerContext } from '@/modules/staff/data/context';
import { getShowManagerVitals } from '@/modules/shows/data/queries';

export const metadata: Metadata = { title: 'Documents — Field & Arena' };

export default async function ShowDocumentsPage({
  params,
}: {
  params: Promise<{ showId: string }>;
}) {
  const { showId } = await params;
  const data = isUuid(showId) ? await getDocumentsPageData(showId) : null;

  if (!data) {
    return (
      <EmptyPanel
        title="Show not found"
        note="This show doesn't exist, or you don't have access to it."
      />
    );
  }

  const [context, vitals] = await Promise.all([
    getOrganizerContext(data.showId),
    getShowManagerVitals(data.showId),
  ]);

  return (
    <ShowManagerShell
      showId={data.showId}
      showName={data.showName}
      activeTab="Documents"
      orgName={context.orgName}
      shows={context.shows}
      stats={vitals.stats}
      stage={vitals.stage}
      canViewMoney={context.canViewMoney}
    >
      <DocumentsCard showId={data.showId} documents={data.documents} classes={data.classes} />
    </ShowManagerShell>
  );
}
