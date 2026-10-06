import type { Metadata } from 'next';
import { getShowName, getShowResults } from '@/modules/shows/data/queries';
import { ResultsPanel } from '@/modules/shows/ui/show-manager/results-panel';
import { EmptyPanel } from '@/shared/ui/workspace-page';
import { resolveShowIdParam } from '@/modules/shows/data/resolve-show-id';
import { getOrganizerContext } from '@/modules/staff/data/context';
import { hasMyShowPermission } from '@/modules/staff/data/queries';

export const metadata: Metadata = { title: 'Results — Field & Arena' };

export default async function ShowResultsPage({ params }: { params: Promise<{ showId: string }> }) {
  const { showId } = await params;
  const id = await resolveShowIdParam(showId);
  if (!id) {
    return (
      <EmptyPanel
        title="Show not found"
        note="This show doesn't exist, or you don't have access to it."
      />
    );
  }

  const showName = await getShowName(id);

  if (showName === null) {
    return (
      <EmptyPanel
        title="Show not found"
        note="This show doesn't exist, or you don't have access to it."
      />
    );
  }

  const [context, rows] = await Promise.all([getOrganizerContext(id), getShowResults(id)]);

  /* Per-show grant, not platform role (an Organizer may be only a Show Admin
   * on this org). has_show_permission already passes the org's owners and
   * SuperAdmin. This toggle has no RLS backstop to pair with (the same rows
   * are already visible on-screen to any staffed role via can_view_show), so
   * hiding the button is the actual control here, not a security boundary. */
  const canExportRoster =
    context.impersonating || (await hasMyShowPermission(id, 'canExportRoster'));

  return <ResultsPanel showName={showName} rows={rows} canExportRoster={canExportRoster} />;
}
