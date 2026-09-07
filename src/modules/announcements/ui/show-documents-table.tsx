'use client';

import { useState } from 'react';
import { EmptyPanel } from '@/modules/staff/ui/workspace-page';
import type { ShowDocument } from '@/modules/announcements/data/queries';

/* Legacy previewed the PDF inline in an expanding panel with a new-tab link as
 * a fallback (announcer.html:558) rather than only handing over a link. That
 * matters here specifically: the documents an announcer opens are the rider
 * pronunciation guide and the approved sponsor copy, read while a ring is
 * running. Losing the board to a new tab mid-class is the thing to avoid. */
export function ShowDocumentsTable({ documents }: { documents: ShowDocument[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

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
          {documents.map((d) => {
            const open = openId === d.id;
            return [
              <tr key={d.id}>
                <td>{d.name}</td>
                <td className="r">
                  {d.url ? (
                    <button
                      type="button"
                      className="dash-btn dash-btn-outline"
                      aria-expanded={open}
                      onClick={() => {
                        setOpenId(open ? null : d.id);
                      }}
                    >
                      {open ? 'Hide' : 'View'}
                    </button>
                  ) : (
                    <span className="card-meta">Unavailable</span>
                  )}
                </td>
              </tr>,
              open && d.url ? (
                <tr key={`${d.id}-preview`}>
                  <td colSpan={2}>
                    <iframe
                      src={d.url}
                      title={d.name}
                      style={{
                        width: '100%',
                        height: '60vh',
                        border: '1px solid #E9EDEB',
                        borderRadius: 8,
                      }}
                    />
                    <div style={{ marginTop: 6 }}>
                      <a href={d.url} target="_blank" rel="noopener noreferrer">
                        Open in a new tab ↗
                      </a>
                    </div>
                  </td>
                </tr>
              ) : null,
            ];
          })}
        </tbody>
      </table>
    </div>
  );
}
