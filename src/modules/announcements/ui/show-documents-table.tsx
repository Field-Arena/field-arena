import { EmptyPanel } from '@/modules/staff/ui/workspace-page';
import type { ShowDocument } from '@/modules/announcements/data/queries';

export function ShowDocumentsTable({ documents }: { documents: ShowDocument[] }) {
  if (documents.length === 0) {
    return (
      <EmptyPanel
        title="No documents shared yet"
        note="Documents the organizer attaches to this show in ShowManager appear here."
      />
    );
  }

  return (
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
                  <a
                    href={d.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="dash-btn dash-btn-outline"
                  >
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
  );
}
