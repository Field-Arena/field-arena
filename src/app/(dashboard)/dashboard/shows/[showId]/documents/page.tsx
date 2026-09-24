import type { Metadata } from 'next';
import { getDocumentsPageData, getDocumentRequirements } from '@/modules/shows/data/setup-queries';
import { ShowManagerShell } from '@/modules/shows/ui/show-manager/show-manager-shell';
import { DocumentsCard } from '@/modules/shows/ui/show-manager/documents-card';
import { RequiredDocumentsCard } from '@/modules/shows/ui/show-manager/required-documents-card';
import { EmptyPanel } from '@/modules/staff/ui/workspace-page';
import { resolveShowIdParam } from '@/modules/shows/data/resolve-show-id';
import { getOrganizerContext } from '@/modules/staff/data/context';
import { getShowManagerVitals } from '@/modules/shows/data/queries';

export const metadata: Metadata = { title: 'Documents — Field & Arena' };

export default async function ShowDocumentsPage({
  params,
}: {
  params: Promise<{ showId: string }>;
}) {
  const { showId } = await params;
  const id = await resolveShowIdParam(showId);
  const data = id ? await getDocumentsPageData(id) : null;

  if (!data) {
    return (
      <EmptyPanel
        title="Show not found"
        note="This show doesn't exist, or you don't have access to it."
      />
    );
  }

  const [context, vitals, documentRequirements] = await Promise.all([
    getOrganizerContext(data.showId),
    getShowManagerVitals(data.showId),
    getDocumentRequirements(data.showId),
  ]);

  return (
    <ShowManagerShell
      showId={showId}
      showName={data.showName}
      activeTab="Documents"
      orgName={context.orgName}
      shows={context.shows}
      stats={vitals.stats}
      stage={vitals.stage}
      canViewMoney={context.canViewMoney}
    >
      <div id="required-documents" className="scroll-mt-24">
        <RequiredDocumentsCard showId={data.showId} documentRequirements={documentRequirements} />
      </div>
      <DocumentsCard
        showId={data.showId}
        publicId={showId}
        documents={data.documents}
        classes={data.classes}
      />
    </ShowManagerShell>
  );
}
