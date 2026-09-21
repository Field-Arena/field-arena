import type { Metadata } from 'next';
import { getOrganizerContext } from '@/modules/staff/data/context';
import { getEntryLedgerPageData } from '@/modules/shows/data/entry-ledger-queries';
import { FilingCabinetShell } from '@/modules/shows/ui/filing-cabinet/filing-cabinet-shell';
import { EntryLedgerScreen } from '@/modules/shows/ui/filing-cabinet/entry-ledger-screen';
import { EmptyPanel } from '@/modules/staff/ui/workspace-page';

export const metadata: Metadata = { title: 'Entry Ledger — Field & Arena' };

export default async function EntryLedgerPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const { show: requestedShowId } = await searchParams;
  const context = await getOrganizerContext(requestedShowId);

  const data = context.currentShow ? await getEntryLedgerPageData(context.currentShow.id) : null;

  return (
    <FilingCabinetShell
      activeKey="entry-ledger"
      orgName={context.orgName}
      shows={context.shows}
      currentShow={context.currentShow}
    >
      {data ? (
        <EntryLedgerScreen
          data={data}
          publicId={context.currentShow?.slug ?? context.currentShow?.id}
        />
      ) : (
        <EmptyPanel title="Show not found" note="This show may have been removed." />
      )}
    </FilingCabinetShell>
  );
}
