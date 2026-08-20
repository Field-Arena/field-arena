import type { Metadata } from 'next';
import { listMyShows, listShowDocuments } from '@/modules/operations/data/queries';
import { DocumentUploadButton } from '@/modules/operations/ui/document-upload-button';
import { EmptyPanel } from '@/modules/staff/ui/workspace-page';

export const metadata: Metadata = { title: 'Documents — Field & Arena' };

export default async function OperationsDocumentsPage({
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
            <p>Reference documents for show staff.</p>
          </div>
        </div>
        <div className="dash-card">
          <EmptyPanel
            title="No shows assigned"
            note="You are not staffed on any show yet. An organizer adds show staff from ShowManager."
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
          <p>
            One shared document library — judges, scribes, and announcers see whatever you upload
            here.
          </p>
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

        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <DocumentUploadButton showId={currentShow.id} />
          <span style={{ fontSize: 12, color: 'var(--fa-muted)' }}>PDF only</span>
        </div>

        {documents.length === 0 ? (
          <EmptyPanel
            title="No documents yet"
            note="Upload a PDF — judges, scribes, and announcers on this show will be able to see it."
          />
        ) : (
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {documents.map((doc) => (
              <div
                key={doc.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  padding: '14px 16px',
                }}
              >
                <span aria-hidden="true">📄</span>
                <span style={{ flex: 1, fontWeight: 600, color: 'var(--hunter-deep)' }}>
                  {doc.name}
                </span>
                {doc.url && (
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 13, fontWeight: 600, color: 'var(--hunter-soft)' }}
                  >
                    View
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
        <p style={{ marginTop: 14, fontSize: 12, color: 'var(--fa-muted)' }}>
          Removing a document is managed by your organizer in Show Manager.
        </p>
      </div>
    </>
  );
}
