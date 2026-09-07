import type { Metadata } from 'next';
import { getRunShowData } from '@/modules/shows/data/queries';
import { getOrganizerContext } from '@/modules/staff/data/context';
import { ShowManagerShell } from '@/modules/shows/ui/show-manager/show-manager-shell';
import { RunShowCard } from '@/modules/shows/ui/show-manager/run-show-card';
import { EmptyPanel } from '@/modules/staff/ui/workspace-page';
import { isUuid } from '@/shared/lib/utils';

export const metadata: Metadata = { title: 'Run Show — Field & Arena' };

export default async function RunShowPage({ params }: { params: Promise<{ showId: string }> }) {
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
    <ShowManagerShell
      showId={data.showId}
      showName={data.showName}
      activeTab="Run Show"
      orgName={context.orgName}
      shows={context.shows}
      stats={data.stats}
      stage={data.stage}
      canViewMoney={context.canViewMoney}
    >
      <RunShowCard data={data} />
    </ShowManagerShell>
  );
}
