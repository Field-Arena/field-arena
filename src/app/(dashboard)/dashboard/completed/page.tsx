import { getOrganizerContext } from '@/modules/staff/data/context';
import { listShowsForPicker } from '@/modules/shows/data/queries';
import { todayIsoInZone } from '@/modules/staff/utils';
import { pickFinishedShows } from '@/modules/shows/utils/current-shows';
import { toDashboardShowRows } from '@/modules/shows/utils/dashboard-show-rows';
import { CompletedShows } from '@/modules/staff/ui/completed-shows';

export default async function CompletedShowsPage() {
  const context = await getOrganizerContext();
  const shows = context.orgId ? toDashboardShowRows(await listShowsForPicker(context.orgId)) : [];
  return <CompletedShows shows={pickFinishedShows(shows, todayIsoInZone())} />;
}
