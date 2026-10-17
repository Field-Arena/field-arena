import type { Metadata } from 'next';
import {
  listMyShows,
  listShowDocuments,
  pickCurrentShow,
} from '@/modules/announcements/data/queries';
import { ShowSwitcher } from '@/modules/announcements/ui/show-switcher';
import { ShowDocumentsTable } from '@/modules/announcements/ui/show-documents-table';
import { EmptyState, PageHeader } from '@/shared/ui/organizer/fa-page';

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
        <PageHeader
          eyebrow="Rider pronunciation guides, sponsor copy, and rule references for your show"
          title="Documents"
        />
        <EmptyState
          title="No shows assigned"
          note="You are not staffed as an announcer on any show yet. An organizer adds an announcer from ShowManager."
        />
      </>
    );
  }

  const documents = await listShowDocuments(currentShow.id);

  return (
    <>
      <PageHeader
        eyebrow="Rider pronunciation guides, sponsor copy, and rule references for your show"
        title="Documents"
        actions={<ShowSwitcher currentShow={currentShow} shows={shows} />}
      />
      <ShowDocumentsTable documents={documents} />
    </>
  );
}
