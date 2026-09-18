import type { Metadata } from 'next';
import { getOrganizerContext } from '@/modules/staff/data/context';
import { getQuickReportsPageData } from '@/modules/shows/data/quick-reports-queries';
import { FilingCabinetShell } from '@/modules/shows/ui/filing-cabinet/filing-cabinet-shell';
import { QuickReportsScreen } from '@/modules/shows/ui/filing-cabinet/quick-reports-screen';
import { EmptyPanel } from '@/modules/staff/ui/workspace-page';

export const metadata: Metadata = { title: 'Quick Reports — Field & Arena' };

export default async function QuickReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const { show: requestedShowId } = await searchParams;
  const context = await getOrganizerContext(requestedShowId);

  const data = context.currentShow ? await getQuickReportsPageData(context.currentShow.id) : null;

  return (
    <FilingCabinetShell
      activeKey="quick-reports"
      orgName={context.orgName}
      shows={context.shows}
      currentShow={context.currentShow}
    >
      {data ? (
        <QuickReportsScreen data={data} />
      ) : (
        <EmptyPanel
          title="Show not found"
          note="This show doesn't exist, or you don't have access to it."
        />
      )}
    </FilingCabinetShell>
  );
}
