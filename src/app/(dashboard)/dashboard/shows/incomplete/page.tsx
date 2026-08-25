import type { Metadata } from 'next';
import { getOrganizerContext } from '@/modules/staff/data/context';
import {
  listIncompleteShowsForOrg,
  type IncompleteShowSummary,
} from '@/modules/shows/data/queries';
import { getShowCompleteness } from '@/modules/shows/data/setup-queries';
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
  const rows: IncompleteShowRow[] = await Promise.all(
    shows.map(async (show) => ({
      show,
      completeness: await getShowCompleteness(show.id),
    })),
  );

  return <IncompleteShowsScreen orgName={context.orgName} rows={rows} />;
}
