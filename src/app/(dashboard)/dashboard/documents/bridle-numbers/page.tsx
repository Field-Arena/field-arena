import type { Metadata } from 'next';
import { getOrganizerContext } from '@/modules/staff/data/context';
import {
  getBridleNumberPoolStatus,
  listAvailableBridleNumbers,
} from '@/modules/shows/data/bridle-number-queries';
import { FilingCabinetShell } from '@/modules/shows/ui/filing-cabinet/filing-cabinet-shell';
import { BridleNumbersScreen } from '@/modules/shows/ui/filing-cabinet/bridle-numbers-screen';
import { EmptyPanel } from '@/modules/staff/ui/workspace-page';

export const metadata: Metadata = { title: 'Bridle Numbers — Field & Arena' };

export default async function BridleNumbersPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const { show: requestedShowId } = await searchParams;
  const context = await getOrganizerContext(requestedShowId);

  const [data, availableBridleNumbers] = context.currentShow
    ? await Promise.all([
        getBridleNumberPoolStatus(context.currentShow.id),
        listAvailableBridleNumbers(context.currentShow.id),
      ])
    : [null, []];

  return (
    <FilingCabinetShell
      activeKey="bridle-numbers"
      orgName={context.orgName}
      shows={context.shows}
      currentShow={context.currentShow}
    >
      {data ? (
        <BridleNumbersScreen data={data} availableBridleNumbers={availableBridleNumbers} />
      ) : (
        <EmptyPanel title="Show not found" note="This show may have been removed." />
      )}
    </FilingCabinetShell>
  );
}
