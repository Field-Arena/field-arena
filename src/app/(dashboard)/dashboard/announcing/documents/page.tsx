import type { Metadata } from 'next';
import { listMyShows, listShowDocuments } from '@/modules/announcements/data/queries';
import { EmptyPanel } from '@/modules/staff/ui/workspace-page';

export const metadata: Metadata = { title: 'Documents — Field & Arena' };

/**
 * "Documents" — ported from announcer.html's Documents section: the show's
 * real document library (rider pronunciation guides, sponsor read copy, PA
 * quick-start sheets), previously previewed inline via an iframe. Was
 * missing entirely from the migrated Announcer dashboard until now — opens
 * in a new tab rather than an inline iframe preview, matching how documents
 * are already opened elsewhere in this app (e.g. `modules/judging`'s
 * reference docs) rather than introducing a one-off inline-preview pattern.
 */
export default async function AnnouncingDocumentsPage({
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
            <h1>Documents</h1>
            <p>Rider pronunciation guides, sponsor copy, and rule references for your show.</p>
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

  const documents = await listShowDocuments(currentShow.id);

  return (
    <>
      <div className="dash-head">
        <div>
          <h1>Documents</h1>
          <p>Rider pronunciation guides, sponsor copy, and rule references for your show.</p>
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

        {documents.length === 0 ? (
          <EmptyPanel
            title="No documents shared yet"
            note="Documents the organizer attaches to this show in ShowManager appear here."
          />
        ) : (
          <div style={{ overflowX: 'auto', marginTop: 16 }}>
            <table>
              <caption className="sr-only">Show documents</caption>
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col" />
                </tr>
              </thead>
              <tbody>
                {documents.map((d) => (
                  <tr key={d.id}>
                    <td>{d.name}</td>
                    <td className="r">
                      {d.url ? (
                        <a href={d.url} target="_blank" rel="noopener noreferrer" className="dash-btn dash-btn-outline">
                          View ↗
                        </a>
                      ) : (
                        <span className="card-meta">Unavailable</span>
                      )}
                    </td>
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
