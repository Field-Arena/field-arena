import type { Metadata } from 'next';
import { getOrganizerContext } from '@/modules/staff/data/context';
import { getDocumentsPageData } from '@/modules/shows/data/setup-queries';
import { FilingCabinetShell } from '@/modules/shows/ui/filing-cabinet/filing-cabinet-shell';
import { DocumentsCard } from '@/modules/shows/ui/show-manager/documents-card';
import { EmptyPanel } from '@/modules/staff/ui/workspace-page';

export const metadata: Metadata = { title: 'Resources — Field & Arena' };

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const { show: requestedShowId } = await searchParams;
  const context = await getOrganizerContext(requestedShowId);

  const data = context.currentShow ? await getDocumentsPageData(context.currentShow.id) : null;

  return (
    <FilingCabinetShell
      activeKey="resources"
      orgName={context.orgName}
      shows={context.shows}
      currentShow={context.currentShow}
    >
      {data ? (
        <DocumentsCard showId={data.showId} documents={data.documents} classes={data.classes} />
      ) : (
        <EmptyPanel title="Show not found" note="This show may have been removed." />
      )}
    </FilingCabinetShell>
  );
}
