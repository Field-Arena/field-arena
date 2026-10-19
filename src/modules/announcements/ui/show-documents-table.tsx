'use client';

import { useState } from 'react';
import { cn } from '@/shared/lib/utils';
import {
  EmptyState,
  FA_BTN_SMALL,
  FA_MUTED,
  FA_TABLE,
  FA_TABLE_WRAP,
  FA_TD,
  FA_TH,
  FA_THEAD_ROW,
  FA_TR,
} from '@/shared/ui/organizer/fa-page';
import type { ShowDocument } from '@/modules/announcements/types';

/* Legacy previewed the PDF inline in an expanding panel with a new-tab link as
 * a fallback (announcer.html:558) rather than only handing over a link. That
 * matters here specifically: the documents an announcer opens are the rider
 * pronunciation guide and the approved sponsor copy, read while a ring is
 * running. Losing the board to a new tab mid-class is the thing to avoid. */
export function ShowDocumentsTable({ documents }: { documents: ShowDocument[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (documents.length === 0) {
    return (
      <EmptyState
        title="No documents shared yet"
        note="Documents the organizer attaches to this show in ShowManager appear here."
      />
    );
  }

  return (
    <div className={FA_TABLE_WRAP}>
      <table className={FA_TABLE}>
        <caption className="sr-only">Show documents</caption>
        <thead>
          <tr className={FA_THEAD_ROW}>
            <th scope="col" className={FA_TH}>
              Name
            </th>
            <th scope="col" className={FA_TH} />
          </tr>
        </thead>
        <tbody>
          {documents.map((d) => {
            const open = openId === d.id;
            return [
              <tr key={d.id} className={FA_TR}>
                <td className={cn(FA_TD, 'font-bold text-[#0D2C23]')}>{d.name}</td>
                <td className={cn(FA_TD, 'text-right')}>
                  {d.url ? (
                    <button
                      type="button"
                      className={FA_BTN_SMALL}
                      aria-expanded={open}
                      onClick={() => {
                        setOpenId(open ? null : d.id);
                      }}
                    >
                      {open ? 'Hide' : 'View'}
                    </button>
                  ) : (
                    <span className={FA_MUTED}>Unavailable</span>
                  )}
                </td>
              </tr>,
              open && d.url ? (
                <tr key={`${d.id}-preview`}>
                  <td colSpan={2} className="px-3 pb-3">
                    <iframe
                      src={d.url}
                      title={d.name}
                      className="h-[60vh] w-full rounded-[10px] border-[1.5px] border-[#C9D3CE]"
                    />
                    <div className="mt-1.5">
                      <a
                        href={d.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[13px] font-bold text-[#1A5B3C] underline underline-offset-2"
                      >
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
