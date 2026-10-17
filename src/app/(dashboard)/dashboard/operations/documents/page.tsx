import type { Metadata } from 'next';
import { listMyShows, listShowDocuments } from '@/modules/operations/data/queries';
import { DocumentUploadButton } from '@/modules/operations/ui/document-upload-button';
import { DocumentsTable } from '@/modules/operations/ui/documents-table';
import { OPS_WRAP, OpsNoShows } from '@/modules/operations/ui/ops-page';
import { FA_MUTED, PageHeader } from '@/shared/ui/organizer/fa-page';
import { FaShowSelect } from '@/shared/ui/organizer/fa-show-select';

export const metadata: Metadata = { title: 'Documents — Field & Arena' };

export default async function OperationsDocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const { show: requestedShowId } = await searchParams;
  const shows = await listMyShows();
  const currentShow =
    shows.find((s) => s.id === requestedShowId || s.slug === requestedShowId) ?? shows[0] ?? null;

  if (!currentShow) {
    return <OpsNoShows eyebrow="Reference documents for show staff" title="Documents" />;
  }

  const documents = await listShowDocuments(currentShow.id);

  return (
    <div className={OPS_WRAP}>
      <PageHeader
        eyebrow="One shared document library — judges, scribes, and announcers see whatever you upload here."
        title="Documents"
        actions={
          <>
            <FaShowSelect shows={shows} currentRef={currentShow.slug ?? currentShow.id} />
            <span className={FA_MUTED}>PDF only</span>
            <DocumentUploadButton showId={currentShow.id} />
          </>
        }
      />
      <DocumentsTable documents={documents} />
      <p className={`mt-2.5 ${FA_MUTED}`}>
        Removing a document is managed by your organizer in Show Manager.
      </p>
    </div>
  );
}
