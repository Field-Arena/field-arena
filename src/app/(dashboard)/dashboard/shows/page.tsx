import type { Metadata } from 'next';
import { getOrganizerContext } from '@/modules/staff/data/context';
import { listShowsForPicker } from '@/modules/shows/data/queries';
import { getShowCompleteness } from '@/modules/shows/data/setup-queries';
import {
  ShowPickerScreen,
  type ShowPickerRow,
} from '@/modules/shows/ui/show-manager/show-picker-screen';
import { EmptyPanel } from '@/modules/staff/ui/workspace-page';

export const metadata: Metadata = { title: 'Show Manager — Field & Arena' };

export default async function ShowManagerPage() {
  const context = await getOrganizerContext();

  if (!context.orgId) {
    return (
      <EmptyPanel title="No organization" note="This account is not attached to an organization." />
    );
  }

  const shows = await listShowsForPicker(context.orgId);
  const rows: ShowPickerRow[] = await Promise.all(
    shows.map(async (show) => ({
      show,
      completeness: await getShowCompleteness(show.id),
    })),
  );

  return <ShowPickerScreen orgName={context.orgName} rows={rows} />;
}
