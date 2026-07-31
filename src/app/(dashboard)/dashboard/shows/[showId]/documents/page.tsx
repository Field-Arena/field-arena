import type { Metadata } from 'next';
import { getDocumentsPageData } from '@/modules/shows/data/setup-queries';
import { ShowManagerShell } from '@/modules/shows/ui/show-manager/show-manager-shell';
import { DocumentsCard } from '@/modules/shows/ui/show-manager/documents-card';
import { EmptyPanel } from '@/modules/staff/ui/workspace-page';
import { isUuid } from '@/shared/lib/utils';

export const metadata: Metadata = { title: 'Documents — Field & Arena' };

/**
 * Show Manager, Documents tab: /dashboard/shows/[showId]/documents.
 *
 * Reads the show directly rather than through getOrganizerContext(showId),
 * same as the rest of Show Manager — see the Setup tab's page.tsx for why.
 */
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

  return (
    <ShowManagerShell showId={data.showId} showName={data.showName} activeTab="Documents">
      <DocumentsCard showId={data.showId} documents={data.documents} classes={data.classes} />
    </ShowManagerShell>
  );
}
