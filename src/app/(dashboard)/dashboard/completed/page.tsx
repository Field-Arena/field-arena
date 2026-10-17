import { getOrganizerContext } from '@/modules/staff/data/context';
import { listDashboardShows } from '@/modules/shows/data/queries';
import { earliestTodayIso } from '@/modules/shows/utils/today-iso';
import { pickFinishedShows } from '@/modules/shows/utils/current-shows';
import { CompletedShows } from '@/modules/staff/ui/completed-shows';

export default async function CompletedShowsPage() {
  const context = await getOrganizerContext();
  const shows = context.orgId ? await listDashboardShows(context.orgId) : [];
  return <CompletedShows shows={pickFinishedShows(shows, earliestTodayIso())} />;
}
