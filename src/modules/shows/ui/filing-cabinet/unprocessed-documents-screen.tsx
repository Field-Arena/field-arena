'use client';

import { EmptyState, FaCard, Pill } from '@/shared/ui/organizer/fa-page';
import { DocumentViewerDialog } from '@/shared/ui/organizer/document-viewer-dialog';
import type { HorsesPageData } from '@/modules/shows/types';
import { DocumentReviewDialog } from '@/modules/shows/ui/filing-cabinet/document-review-dialog';
import { CabinetSectionHead } from '@/modules/shows/ui/filing-cabinet/cabinet-section-head';

export function UnprocessedDocumentsScreen({ data }: { data: HorsesPageData }) {
  const { showId, showName, rows } = data;

  const pendingRows = rows
    .filter((r) => r.horseId && r.documents.some((d) => d.uploaded && d.status === 'pending'))
    .map((r) => ({
      ...r,
      documents: r.documents.filter((d) => d.uploaded && d.status === 'pending'),
    }));

  return (
    <div className="text-ink-deep font-[family-name:var(--font-ar)]">
      <CabinetSectionHead
        title="Unprocessed documents"
        lede={
          <>
            Everything uploaded for {showName} that hasn&apos;t been reviewed yet. Approve, reject
            with a reason, or ask for a replacement — approved documents leave this queue but stay
            visible on the entry.
          </>
        }
      />

      {pendingRows.length === 0 ? (
        <EmptyState title="Nothing waiting on review right now" />
      ) : (
        <div className="flex flex-col gap-3">
          {pendingRows.map((row) => (
            <FaCard key={row.key}>
              <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <span className="text-[15px] font-bold">{row.horseName}</span>
                  <span className="ml-2 text-[12.5px] font-semibold text-[#5A6B63]">
                    {row.riderLabel}
                  </span>
                </div>
                <Pill tone="yellow">{row.documents.length} awaiting review</Pill>
              </div>
              <div className="flex flex-col gap-2">
                {row.documents.map((doc) => (
                  <div
                    key={doc.requirementId}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-[10px] border-[1.5px] border-[#EDF0EE] px-3 py-2"
                  >
                    <span className="text-[13px] font-semibold">{doc.label}</span>
                    <div className="flex items-center gap-2">
                      {doc.url && (
                        <DocumentViewerDialog
                          url={doc.url}
                          name={`${row.horseName} — ${doc.label}`}
                          backLabel="Back to Unprocessed Documents"
                          triggerClassName="text-[12.5px] font-bold text-[#1A5B3C] underline"
                        />
                      )}
                      {row.horseId && (
                        <DocumentReviewDialog
                          showId={showId}
                          horseId={row.horseId}
                          horseName={row.horseName}
                          doc={doc}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </FaCard>
          ))}
        </div>
      )}
    </div>
  );
}
