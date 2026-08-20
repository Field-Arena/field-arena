import type { Metadata } from 'next';
import { listMyShows, listShowContacts } from '@/modules/announcements/data/queries';
import { ShowSwitcher } from '@/modules/announcements/ui/show-switcher';
import { ShowContactsTable } from '@/modules/announcements/ui/show-contacts-table';
import { EmptyPanel } from '@/modules/staff/ui/workspace-page';

export const metadata: Metadata = { title: 'Contacts — Field & Arena' };

export default async function AnnouncingContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const { show: requestedShowId } = await searchParams;
  const shows = await listMyShows();
  const currentShow = shows.find((s) => s.id === requestedShowId) ?? shows[0] ?? null;

  if (!currentShow) {
    return (
      <>
        <div className="dash-head">
          <div>
            <h1>Contacts</h1>
            <p>Judges, scribes, and show staff for your current assignment.</p>
          </div>
        </div>
        <div className="dash-card">
          <EmptyPanel
            title="No shows assigned"
            note="You are not staffed on any show yet. An organizer adds an announcer from ShowManager."
          />
        </div>
      </>
    );
  }

  const contacts = await listShowContacts(currentShow.id);

  return (
    <>
      <div className="dash-head">
        <div>
          <h1>Contacts</h1>
          <p>Judges, scribes, and show staff for your current assignment.</p>
        </div>
      </div>

      <div className="dash-card">
        <ShowSwitcher currentShow={currentShow} shows={shows} />
        <ShowContactsTable contacts={contacts} />
      </div>
    </>
  );
}
