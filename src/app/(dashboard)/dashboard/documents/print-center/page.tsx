import type { Metadata } from 'next';
import { getOrganizerContext } from '@/modules/staff/data/context';
import { getEntryLedgerPageData } from '@/modules/shows/data/entry-ledger-queries';
import { FilingCabinetShell } from '@/modules/shows/ui/filing-cabinet/filing-cabinet-shell';
import { PrintCenterScreen } from '@/modules/shows/ui/filing-cabinet/print-center-screen';
import { EmptyPanel } from '@/modules/staff/ui/workspace-page';

export const metadata: Metadata = { title: 'Print Center — Field & Arena' };

export default async function PrintCenterPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const { show: requestedShowId } = await searchParams;
  const context = await getOrganizerContext(requestedShowId);

  const data = context.currentShow ? await getEntryLedgerPageData(context.currentShow.id) : null;

  return (
    <FilingCabinetShell
      activeKey="print-center"
      orgName={context.orgName}
      shows={context.shows}
      currentShow={context.currentShow}
    >
      {data ? (
        <PrintCenterScreen data={data} />
      ) : (
        <EmptyPanel title="Show not found" note="This show may have been removed." />
      )}
    </FilingCabinetShell>
  );
}
