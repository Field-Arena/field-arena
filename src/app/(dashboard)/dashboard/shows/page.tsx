import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getOrganizerContext } from '@/modules/staff/data/context';
import { listShowsForPicker } from '@/modules/shows/data/queries';
import { getShowsCompleteness } from '@/modules/shows/data/setup-queries';
import {
  ShowPickerScreen,
  type ShowPickerRow,
} from '@/modules/shows/ui/show-manager/show-picker-screen';
import { EmptyPanel } from '@/shared/ui/workspace-page';

export const metadata: Metadata = { title: 'Show Manager — Field & Arena' };

/* The redesign's Show Manager opens straight onto the focused show ("one
 * show at a time"); the list of every show is still here behind ?all=1,
 * linked from the Show Manager header as "All shows". */
export default async function ShowManagerPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string; all?: string }>;
}) {
  const { show: requestedShowId, all } = await searchParams;
  const context = await getOrganizerContext(requestedShowId);

  if (!context.orgId) {
    return (
      <EmptyPanel title="No organization" note="This account is not attached to an organization." />
    );
  }

  if (!all && context.currentShow) {
    redirect(`/dashboard/shows/${context.currentShow.slug ?? context.currentShow.id}`);
  }

  const shows = await listShowsForPicker(context.orgId);
  const completenessByShow = await getShowsCompleteness(shows.map((s) => s.id));
  const rows: ShowPickerRow[] = shows.map((show) => ({
    show,
    completeness: completenessByShow.get(show.id) ?? { sections: [], complete: false },
  }));

  return <ShowPickerScreen orgName={context.orgName} rows={rows} />;
}
