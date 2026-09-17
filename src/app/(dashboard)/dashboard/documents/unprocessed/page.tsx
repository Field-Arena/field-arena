import type { Metadata } from 'next';
import { getOrganizerContext } from '@/modules/staff/data/context';
import { getHorsesPageData } from '@/modules/shows/data/horses-queries';
import { FilingCabinetShell } from '@/modules/shows/ui/filing-cabinet/filing-cabinet-shell';
import { UnprocessedDocumentsScreen } from '@/modules/shows/ui/filing-cabinet/unprocessed-documents-screen';
import { EmptyPanel } from '@/modules/staff/ui/workspace-page';

export const metadata: Metadata = { title: 'Unprocessed Documents — Field & Arena' };

export default async function UnprocessedDocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const { show: requestedShowId } = await searchParams;
  const context = await getOrganizerContext(requestedShowId);

  const data = context.currentShow ? await getHorsesPageData(context.currentShow.id) : null;

  return (
    <FilingCabinetShell
      activeKey="unprocessed"
      orgName={context.orgName}
      shows={context.shows}
      currentShow={context.currentShow}
    >
      {data ? (
        <UnprocessedDocumentsScreen data={data} />
      ) : (
        <EmptyPanel title="Show not found" note="This show may have been removed." />
      )}
    </FilingCabinetShell>
  );
}
