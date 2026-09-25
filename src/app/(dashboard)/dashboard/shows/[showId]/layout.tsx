import { getShowManagerHeader } from '@/modules/shows/data/setup-queries';
import { ShowManagerShell } from '@/modules/shows/ui/show-manager/show-manager-shell';
import { EmptyPanel } from '@/modules/staff/ui/workspace-page';
import { resolveShowIdParam } from '@/modules/shows/data/resolve-show-id';
import { getOrganizerContext } from '@/modules/staff/data/context';
import { getShowManagerVitals } from '@/modules/shows/data/queries';

/* Renders the Show Manager shell (title, tab strip, lifecycle, stats) once
 * per show instead of once per tab -- previously every one of the 8 tab
 * pages re-fetched context/vitals and re-rendered the whole shell itself,
 * which also meant the tab strip flashed out and back in on every click
 * because it wasn't behind a stable layout boundary. Each tab's own page.tsx
 * still does its own tab-specific data fetch; only the shell's own data
 * (header/context/vitals) lives here now. */
export default async function ShowManagerLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ showId: string }>;
}) {
  const { showId } = await params;
  const id = await resolveShowIdParam(showId);
  const header = id ? await getShowManagerHeader(id) : null;

  if (!header) {
    return (
      <EmptyPanel
        title="Show not found"
        note="This show doesn't exist, or you don't have access to it."
      />
    );
  }

  const [context, vitals] = await Promise.all([
    getOrganizerContext(header.id),
    getShowManagerVitals(header.id),
  ]);

  return (
    <ShowManagerShell
      showId={showId}
      showName={header.name}
      orgName={context.orgName}
      shows={context.shows}
      stats={vitals.stats}
      stage={vitals.stage}
      canViewMoney={context.canViewMoney}
    >
      {children}
    </ShowManagerShell>
  );
}
