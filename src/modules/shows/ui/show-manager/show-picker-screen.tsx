'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatDateShort } from '@/shared/lib/format/date';
import { SHOW_STAGES } from '@/shared/constants/show-stages';
import type { ShowCompleteness, ShowPickerSummary } from '@/modules/shows/types';
import { MissingSectionsDialog } from '@/modules/shows/ui/incomplete/missing-sections-dialog';
import { NewShowButton } from '@/modules/shows/ui/show-manager/new-show-button';
import { DeleteShowButton } from '@/modules/shows/ui/show-manager/delete-show-button';

export interface ShowPickerRow {
  show: ShowPickerSummary;
  completeness: ShowCompleteness;
}

export function ShowPickerScreen({ orgName, rows }: { orgName: string; rows: ShowPickerRow[] }) {
  const [openShowId, setOpenShowId] = useState<string | null>(null);
  const openRow = rows.find((r) => r.show.id === openShowId);

  return (
    <section>
      <div className="fa-page-head">
        <div>
          <h2>All shows</h2>
          <p>
            Every show {orgName} runs — open one to set it up, schedule it, and run it. Show Manager
            works on one show at a time.
          </p>
        </div>
        <div className="fa-head-actions">
          <NewShowButton variant="primary" />
        </div>
      </div>

      <div className="fa-card">
        <div className="fa-card-head">
          <div>
            <h3>Your shows</h3>
            <div className="fa-sub">
              {rows.length} show{rows.length === 1 ? '' : 's'} · pick one to open it
            </div>
          </div>
        </div>

        {rows.length === 0 ? (
          <p className="px-5 py-8 text-center text-[13.5px] text-[var(--fa-ink-3)]">
            No shows yet — create one to get started.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="fa-table min-w-[720px]">
              <thead>
                <tr>
                  <th>Show</th>
                  <th>Stage</th>
                  <th>Setup</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {rows.map(({ show, completeness }) => {
                  const ref = show.slug ?? show.id;
                  const stage = SHOW_STAGES.find((st) => st.key === show.stage)?.label ?? 'Setup';
                  return (
                    <tr key={show.id}>
                      <td>
                        <Link
                          href={`/dashboard/shows/${ref}`}
                          prefetch={false}
                          className="fa-show-name no-underline hover:text-[var(--fa-brand)]"
                        >
                          {show.name}
                        </Link>
                        <div className="fa-org-loc">
                          {show.dateLabel ??
                            (show.startDate ? formatDateShort(show.startDate) : 'Dates TBD')}
                          {show.venueName ? ` · ${show.venueName}` : ''}
                        </div>
                      </td>
                      <td>
                        <span className={`fa-badge ${show.published ? 'fa-live' : 'fa-stub'}`}>
                          <span className="fa-dot" />
                          {show.published ? stage : 'Draft'}
                        </span>
                      </td>
                      <td>
                        {completeness.complete ? (
                          <span className="fa-badge fa-onboard">
                            <span className="fa-dot" />
                            Complete
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="fa-badge fa-pending cursor-pointer border-0"
                            title="See what's missing"
                            onClick={() => {
                              setOpenShowId(show.id);
                            }}
                          >
                            <span className="fa-dot" />
                            Incomplete · see what&rsquo;s missing
                          </button>
                        )}
                      </td>
                      <td>
                        <div className="fa-row-actions items-center">
                          <Link
                            href={
                              show.published
                                ? `/dashboard/shows/${ref}/run-show`
                                : `/dashboard/shows/${ref}`
                            }
                            prefetch={false}
                            className="fa-act fa-enter"
                          >
                            {show.published ? 'Run show →' : 'Set up →'}
                          </Link>
                          {!show.published && (
                            <DeleteShowButton showId={show.id} showName={show.name} />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {openRow && (
        <MissingSectionsDialog
          showId={openRow.show.slug ?? openRow.show.id}
          showName={openRow.show.name}
          sections={openRow.completeness.sections}
          onClose={() => {
            setOpenShowId(null);
          }}
        />
      )}
    </section>
  );
}
