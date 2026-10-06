import type { Metadata } from 'next';
import { getRingStatus } from '@/modules/announcements/data/queries';
import { listStaff } from '@/modules/shows/data/setup-queries';
import { getShowStats } from '@/modules/shows/data/queries';
import {
  getMyPermissions,
  listMyShows,
  listStabling,
  listVendors,
  getHorseCounts,
} from '@/modules/operations/data/queries';
import {
  OperationsBoardScreen,
  OperationsNoShowsScreen,
} from '@/modules/operations/ui/operations-board-screen';
import { groupRingsForBoard } from '@/modules/operations/utils/group-rings';

export const metadata: Metadata = { title: 'Show Operations — Field & Arena' };

export default async function OperationsPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const { show: requestedShowId } = await searchParams;
  const shows = await listMyShows();
  const currentShow =
    shows.find((s) => s.id === requestedShowId || s.slug === requestedShowId) ?? shows[0] ?? null;

  if (!currentShow) return <OperationsNoShowsScreen />;

  const [rings, staff, stats, stabling, permissions, horses] = await Promise.all([
    getRingStatus(currentShow.id),
    listStaff(currentShow.id),
    getShowStats(currentShow.id),
    listStabling(currentShow.id),
    getMyPermissions(currentShow.id),
    getHorseCounts(currentShow.id),
  ]);
  const vendorCount = permissions.canViewMoney ? (await listVendors(currentShow.id)).length : null;

  // One card per ring, not per class — see groupRingsForBoard.
  const ringCards = groupRingsForBoard(rings);
  const live = ringCards.filter((r) => r.current?.scoringOpen).length;

  return (
    <OperationsBoardScreen
      shows={shows}
      currentShow={currentShow}
      riderCount={stats.riders}
      horses={horses}
      stalledCount={stabling.stalls.length}
      vendorCount={vendorCount}
      ringCards={ringCards}
      live={live}
      staff={staff}
    />
  );
}
