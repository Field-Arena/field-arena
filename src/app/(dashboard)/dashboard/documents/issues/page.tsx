import type { Metadata } from 'next';
import { getOrganizerContext } from '@/modules/staff/data/context';
import { getIssuesPageData } from '@/modules/shows/data/entry-issues-queries';
import { FilingCabinetShell } from '@/modules/shows/ui/filing-cabinet/filing-cabinet-shell';
import { IssuesScreen } from '@/modules/shows/ui/filing-cabinet/issues-screen';
import { EmptyPanel } from '@/modules/staff/ui/workspace-page';

export const metadata: Metadata = { title: 'Issues — Field & Arena' };

export default async function IssuesPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const { show: requestedShowId } = await searchParams;
  const context = await getOrganizerContext(requestedShowId);

  const data = context.currentShow ? await getIssuesPageData(context.currentShow.id) : null;

  return (
    <FilingCabinetShell
      activeKey="issues"
      orgName={context.orgName}
      shows={context.shows}
      currentShow={context.currentShow}
    >
      {data ? (
        <IssuesScreen data={data} />
      ) : (
        <EmptyPanel title="Show not found" note="This show may have been removed." />
      )}
    </FilingCabinetShell>
  );
}
