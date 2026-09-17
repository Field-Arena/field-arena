import type { Metadata } from 'next';
import { getOrganizerContext } from '@/modules/staff/data/context';
import { getHorsesPageData } from '@/modules/shows/data/horses-queries';
import { FilingCabinetShell } from '@/modules/shows/ui/filing-cabinet/filing-cabinet-shell';
import { HorsesReportScreen } from '@/modules/shows/ui/filing-cabinet/horses-report-screen';
import { EmptyPanel } from '@/modules/staff/ui/workspace-page';

export const metadata: Metadata = { title: 'Quick Reports — Field & Arena' };

export default async function QuickReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const { show: requestedShowId } = await searchParams;
  const context = await getOrganizerContext(requestedShowId);

  const data = context.currentShow ? await getHorsesPageData(context.currentShow.id) : null;

  return (
    <FilingCabinetShell
      activeKey="quick-reports"
      orgName={context.orgName}
      shows={context.shows}
      currentShow={context.currentShow}
    >
      {data ? (
        <HorsesReportScreen data={data} />
      ) : (
        <EmptyPanel
          title="Show not found"
          note="This show doesn't exist, or you don't have access to it."
        />
      )}
    </FilingCabinetShell>
  );
}
