'use client';
import { useMemo, useState } from 'react';
import type { ShowDocumentRow } from '@/modules/operations/data/queries';
import { OpsSearch } from '@/modules/operations/ui/ops-search';
import {
  ChipRow,
  EmptyState,
  FA_BTN_SMALL,
  FA_TABLE,
  FA_TABLE_WRAP,
  FA_TD,
  FA_TH,
  FA_THEAD_ROW,
  FA_TR,
  StatBox,
  StatGrid,
} from '@/shared/ui/organizer/fa-page';

export function DocumentsTable({ documents }: { documents: ShowDocumentRow[] }) {
  const [term, setTerm] = useState('');

  const rows = useMemo(() => {
    const q = term.trim().toLowerCase();
    return q ? documents.filter((d) => d.name.toLowerCase().includes(q)) : documents;
  }, [documents, term]);

  if (documents.length === 0) {
    return (
      <EmptyState
        title="No documents yet"
        note="Upload a PDF — judges, scribes, and announcers on this show will be able to see it."
      />
    );
  }

  return (
    <>
      <StatGrid cols={2}>
        <StatBox label="Documents" value={documents.length} note="shared with show staff" />
        <StatBox
          label="Ready to open"
          value={documents.filter((d) => d.url).length}
          tone="green"
          note="have a viewable file"
        />
      </StatGrid>

      <ChipRow>
        <OpsSearch
          value={term}
          onChange={setTerm}
          placeholder="Document name"
          label="Search documents"
        />
      </ChipRow>

      <div className={FA_TABLE_WRAP}>
        <table className={FA_TABLE}>
          <thead>
            <tr className={FA_THEAD_ROW}>
              <th className={FA_TH}>Document</th>
              <th className={`${FA_TH} text-right`}>
                <span className="sr-only">Open</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr className={FA_TR}>
                <td colSpan={2} className={`${FA_TD} text-[#5A6B63]`}>
                  No matches.
                </td>
              </tr>
            )}
            {rows.map((doc) => (
              <tr key={doc.id} className={FA_TR}>
                <td className={`${FA_TD} font-bold`}>
                  <span aria-hidden="true" className="mr-2">
                    📄
                  </span>
                  {doc.name}
                </td>
                <td className={`${FA_TD} text-right`}>
                  {doc.url && (
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={FA_BTN_SMALL}
                    >
                      View
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
