import type { Metadata } from 'next';
import { getShowResults } from '@/modules/shows/data/queries';
import { ShowManagerShell } from '@/modules/shows/ui/show-manager/show-manager-shell';
import { ResultsPanel } from '@/modules/shows/ui/show-manager/results-panel';
import { EmptyPanel } from '@/modules/staff/ui/workspace-page';
import { isUuid } from '@/shared/lib/utils';
import { getOrganizerContext } from '@/modules/staff/data/context';
import { getShowManagerVitals } from '@/modules/shows/data/queries';
import { createServerClient } from '@/shared/lib/supabase/server';

export const metadata: Metadata = { title: 'Results — Field & Arena' };

export default async function ShowResultsPage({
  params,
}: {
  params: Promise<{ showId: string }>;
}) {
  const { showId } = await params;
  if (!isUuid(showId)) {
    return (
      <EmptyPanel
        title="Show not found"
        note="This show doesn't exist, or you don't have access to it."
      />
    );
  }

  const supabase = await createServerClient();
  const { data: show } = await supabase.from('shows').select('name').eq('id', showId).maybeSingle();

  if (!show) {
    return (
      <EmptyPanel
        title="Show not found"
        note="This show doesn't exist, or you don't have access to it."
      />
    );
  }

  const [context, vitals, rows] = await Promise.all([
    getOrganizerContext(showId),
    getShowManagerVitals(showId),
    getShowResults(showId),
  ]);

  return (
    <ShowManagerShell
      showId={showId}
      showName={show.name}
      activeTab="Results"
      orgName={context.orgName}
      shows={context.shows}
      stats={vitals.stats}
      stage={vitals.stage}
      canViewMoney={context.canViewMoney}
    >
      <ResultsPanel showName={show.name} rows={rows} />
    </ShowManagerShell>
  );
}
