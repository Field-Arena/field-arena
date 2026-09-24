import type { Metadata } from 'next';
import { getOrganizerContext } from '@/modules/staff/data/context';
import {
  listIncompleteShowsForOrg,
  type IncompleteShowSummary,
} from '@/modules/shows/data/queries';
import { getShowsCompleteness } from '@/modules/shows/data/setup-queries';
import {
  IncompleteShowsScreen,
  type IncompleteShowRow,
} from '@/modules/shows/ui/incomplete/incomplete-shows-screen';
import { EmptyPanel } from '@/modules/staff/ui/workspace-page';

export const metadata: Metadata = { title: 'Incomplete Shows — Field & Arena' };

export default async function IncompleteShowsPage() {
  const context = await getOrganizerContext();

  if (!context.orgId) {
    return (
      <EmptyPanel title="No organization" note="This account is not attached to an organization." />
    );
  }

  const shows: IncompleteShowSummary[] = await listIncompleteShowsForOrg(context.orgId);
  const completenessByShow = await getShowsCompleteness(shows.map((s) => s.id));
  const rows: IncompleteShowRow[] = shows.map((show) => ({
    show,
    completeness: completenessByShow.get(show.id) ?? { sections: [], complete: false },
  }));

  return <IncompleteShowsScreen orgName={context.orgName} rows={rows} />;
}
