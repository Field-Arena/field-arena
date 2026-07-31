import type { Metadata } from 'next';
import { getRunShowData } from '@/modules/shows/data/queries';
import { getOrganizerContext } from '@/modules/staff/data/context';
import { ShowManagerShell } from '@/modules/shows/ui/show-manager/show-manager-shell';
import { RunShowCard } from '@/modules/shows/ui/show-manager/run-show-card';
import { EmptyPanel } from '@/modules/staff/ui/workspace-page';
import { isUuid } from '@/shared/lib/utils';

export const metadata: Metadata = { title: 'Run Show — Field & Arena' };

/**
 * Show Manager, Run Show tab: /dashboard/shows/[showId]/run-show.
 *
 * getOrganizerContext(showId) is only consulted for canViewMoney — the same
 * per-person financial-visibility check the Dashboard and EventSales use.
 * Show identity and the not-found guard both come from getRunShowData
 * directly, same as the other Show Manager tabs, so an id the caller can't
 * see renders not-found instead of silently borrowing another show's
 * permission check.
 */
export default async function RunShowPage({
  params,
}: {
  params: Promise<{ showId: string }>;
}) {
  const { showId } = await params;
  const [data, context] = await Promise.all([
    isUuid(showId) ? getRunShowData(showId) : Promise.resolve(null),
    getOrganizerContext(showId),
  ]);

  if (!data) {
    return (
      <EmptyPanel
        title="Show not found"
        note="This show doesn't exist, or you don't have access to it."
      />
    );
  }

  return (
    <ShowManagerShell showId={data.showId} showName={data.showName} activeTab="Run Show">
      <RunShowCard data={data} canViewMoney={context.canViewMoney} />
    </ShowManagerShell>
  );
}
