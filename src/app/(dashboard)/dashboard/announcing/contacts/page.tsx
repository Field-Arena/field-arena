import type { Metadata } from 'next';
import { listMyShows, listShowContacts } from '@/modules/announcements/data/queries';
import { EmptyPanel } from '@/modules/staff/ui/workspace-page';

export const metadata: Metadata = { title: 'Contacts — Field & Arena' };

/**
 * "Contacts" — ported from announcer.html's Contacts tab: the judges,
 * scribes, and show secretary an announcer may need to reach mid-show.
 * Was missing entirely from the migrated Announcer dashboard until now.
 */
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
        <div className="showbar">
          <span className="showbar-org">{currentShow.name}</span>
          {shows.length > 1 && (
            <form method="get" className="contents">
              <select
                name="show"
                defaultValue={currentShow.id}
                className="dash-select"
                style={{ maxWidth: 380 }}
                aria-label="Select show"
              >
                {shows.map((show) => (
                  <option key={show.id} value={show.id}>
                    {show.name}
                  </option>
                ))}
              </select>
              <button type="submit" className="dash-btn dash-btn-outline">
                Switch
              </button>
            </form>
          )}
        </div>

        {contacts.length === 0 ? (
          <EmptyPanel
            title="No contacts yet"
            note="Judges, scribes, and a show admin appear here once an organizer staffs them on this show."
          />
        ) : (
          <div style={{ overflowX: 'auto', marginTop: 16 }}>
            <table>
              <caption className="sr-only">Show contacts</caption>
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Role</th>
                  <th scope="col">Phone</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((c) => (
                  <tr key={c.staffId}>
                    <td>
                      <strong>{c.name}</strong>
                    </td>
                    <td>{c.role === 'Show Admin' ? 'Show Secretary' : c.role}</td>
                    <td>{c.phone ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
