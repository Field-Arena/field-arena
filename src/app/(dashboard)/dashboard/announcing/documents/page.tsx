import type { Metadata } from 'next';
import { listMyShows, listShowDocuments, pickCurrentShow } from '@/modules/announcements/data/queries';
import { ShowSwitcher } from '@/modules/announcements/ui/show-switcher';
import { ShowDocumentsTable } from '@/modules/announcements/ui/show-documents-table';
import { EmptyPanel } from '@/modules/staff/ui/workspace-page';

export const metadata: Metadata = { title: 'Documents — Field & Arena' };

export default async function AnnouncingDocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const { show: requestedShowId } = await searchParams;
  const shows = await listMyShows();
  const currentShow = pickCurrentShow(shows, requestedShowId);

  if (!currentShow) {
    return (
      <>
        <div className="dash-head">
          <div>
            <h1>Documents</h1>
            <p>Rider pronunciation guides, sponsor copy, and rule references for your show.</p>
          </div>
        </div>
        <div className="dash-card">
          <EmptyPanel
            title="No shows assigned"
            note="You are not staffed as an announcer on any show yet. An organizer adds an announcer from ShowManager."
          />
        </div>
      </>
    );
  }

  const documents = await listShowDocuments(currentShow.id);

  return (
    <>
      <div className="dash-head">
        <div>
          <h1>Documents</h1>
          <p>Rider pronunciation guides, sponsor copy, and rule references for your show.</p>
        </div>
      </div>

      <div className="dash-card">
        <ShowSwitcher currentShow={currentShow} shows={shows} />
        <ShowDocumentsTable documents={documents} />
      </div>
    </>
  );
}
