import type { Metadata } from 'next';
import { getOrganizerContext } from '@/modules/staff/data/context';
import { getEntryLedgerPageData } from '@/modules/shows/data/entry-ledger-queries';
import { getTestPrintCounts } from '@/modules/shows/data/test-print-queries';
import { getRingPacketData } from '@/modules/shows/data/ring-packet-queries';
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

  const [data, testPrintData, ringPacketData] = context.currentShow
    ? await Promise.all([
        getEntryLedgerPageData(context.currentShow.id),
        getTestPrintCounts(context.currentShow.id),
        getRingPacketData(context.currentShow.id),
      ])
    : [null, null, null];

  return (
    <FilingCabinetShell
      activeKey="print-center"
      orgName={context.orgName}
      shows={context.shows}
      currentShow={context.currentShow}
    >
      {data ? (
        <PrintCenterScreen
          data={data}
          testPrintData={testPrintData}
          ringPacketData={ringPacketData}
        />
      ) : (
        <EmptyPanel title="Show not found" note="This show may have been removed." />
      )}
    </FilingCabinetShell>
  );
}
