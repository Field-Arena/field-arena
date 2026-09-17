import type { Metadata } from 'next';
import { getOrganizerContext } from '@/modules/staff/data/context';
import { getMembershipLedgerPageData } from '@/modules/shows/data/membership-ledger-queries';
import { FilingCabinetShell } from '@/modules/shows/ui/filing-cabinet/filing-cabinet-shell';
import { MembershipLedgerScreen } from '@/modules/shows/ui/filing-cabinet/membership-ledger-screen';
import { EmptyPanel } from '@/modules/staff/ui/workspace-page';

export const metadata: Metadata = { title: 'Membership Ledger — Field & Arena' };

export default async function MembershipLedgerPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const { show: requestedShowId } = await searchParams;
  const context = await getOrganizerContext(requestedShowId);

  const data = context.currentShow
    ? await getMembershipLedgerPageData(context.currentShow.id)
    : null;

  return (
    <FilingCabinetShell
      activeKey="membership-ledger"
      orgName={context.orgName}
      shows={context.shows}
      currentShow={context.currentShow}
    >
      {data ? (
        <MembershipLedgerScreen data={data} />
      ) : (
        <EmptyPanel title="Show not found" note="This show may have been removed." />
      )}
    </FilingCabinetShell>
  );
}
