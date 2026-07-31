import type { Metadata } from 'next';
import { getOrganizerContext } from '@/modules/staff/data/context';
import { getDocumentRequirements, listShowDocuments } from '@/modules/shows/data/setup-queries';
import { WorkspacePage, EmptyPanel } from '@/modules/staff/ui/workspace-page';
import { StatusBadge } from '@/shared/ui/status-badge';
import { formatTimestamp } from '@/shared/lib/format/date';

export const metadata: Metadata = { title: 'Documents — Field & Arena' };

/**
 * Two different things share this page, as they did in the legacy view.
 *
 * Document *requirements* are what a rider must upload before their horse counts
 * as compliant — Coggins, vaccination records. Document *library* files are what
 * the organizer publishes to competitors: prize lists, maps, schedules. They are
 * unrelated apart from both being paperwork, so they are labelled distinctly
 * rather than merged into one list.
 */
export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const { show: requestedShowId } = await searchParams;
  const context = await getOrganizerContext(requestedShowId);

  if (!context.currentShow) {
    return (
      <WorkspacePage
        title="Documents"
        description="Paperwork you require from riders, and files you publish to them."
        orgName={context.orgName}
        showPicker={false}
      >
        <EmptyPanel title="No shows yet" note="Documents are configured per show." />
      </WorkspacePage>
    );
  }

  const [documents, requirements] = await Promise.all([
    listShowDocuments(context.currentShow.id),
    getDocumentRequirements(context.currentShow.id),
  ]);

  return (
    <WorkspacePage
      title="Documents"
      description="Paperwork you require from riders, and files you publish to them."
      orgName={context.orgName}
      shows={context.shows}
      currentShow={context.currentShow}
    >
      <h2 className="show-detail-title" style={{ marginTop: 16 }}>
        Required from riders
      </h2>
      {requirements.length === 0 ? (
        <EmptyPanel
          title="No document requirements"
          note="Riders can enter without uploading anything for this show."
        />
      ) : (
        <div style={{ overflowX: 'auto', marginTop: 10 }}>
          <table>
            <caption className="sr-only">Documents riders must upload</caption>
            <thead>
              <tr>
                <th scope="col">Document</th>
                <th scope="col">Expiry tracked</th>
                <th scope="col">Staff approval</th>
              </tr>
            </thead>
            <tbody>
              {requirements.map((req) => (
                <tr key={req.id}>
                  <td>
                    <strong>{req.label}</strong>
                  </td>
                  <td>
                    {req.requiresExpiration ? (
                      <StatusBadge tone="info">Expiry required</StatusBadge>
                    ) : (
                      <span style={{ color: 'var(--fa-muted)', fontSize: 12.5 }}>Not tracked</span>
                    )}
                  </td>
                  <td>
                    {req.requiresApproval ? (
                      <StatusBadge tone="warn">Must be reviewed</StatusBadge>
                    ) : (
                      <span style={{ color: 'var(--fa-muted)', fontSize: 12.5 }}>
                        On file is enough
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="doc-note">
        A requirement marked &ldquo;must be reviewed&rdquo; needs a staff member with document
        approval to actually look at the upload before it counts — being on file is not enough.
      </p>

      <h2 className="show-detail-title" style={{ marginTop: 26 }}>
        Published to competitors
      </h2>
      {documents.length === 0 ? (
        <EmptyPanel
          title="No files published"
          note="Nothing has been uploaded for this show yet — publish files from the Documents tab in Show Manager."
        />
      ) : (
        <div className="doc-list" style={{ marginTop: 10 }}>
          {documents.map((doc) => (
            <div key={doc.id} className="doc-row">
              <span className="doc-name">{doc.name}</span>
              <span className="doc-meta">{formatTimestamp(doc.createdAt)}</span>
              {doc.url && (
                <a href={doc.url} className="doc-link" target="_blank" rel="noreferrer">
                  View
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </WorkspacePage>
  );
}
