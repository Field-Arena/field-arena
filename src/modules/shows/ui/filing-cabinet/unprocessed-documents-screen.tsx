'use client';

import { ScreenTitle, ScreenLede, Card } from '@/shared/ui/organizer/card';
import { StatusBadge } from '@/shared/ui/status-badge';
import type { HorsesPageData } from '@/modules/shows/data/horses-queries';
import { DocumentReviewDialog } from '@/modules/shows/ui/filing-cabinet/document-review-dialog';

export function UnprocessedDocumentsScreen({ data }: { data: HorsesPageData }) {
  const { showId, showName, rows } = data;

  const pendingRows = rows
    .filter((r) => r.horseId && r.documents.some((d) => d.uploaded && d.status === 'pending'))
    .map((r) => ({ ...r, documents: r.documents.filter((d) => d.uploaded && d.status === 'pending') }));

  return (
    <div className="text-ink-deep font-[family-name:var(--font-ar)]">
      <div className="mb-4">
        <ScreenTitle className="mb-1.5">Unprocessed Documents</ScreenTitle>
        <ScreenLede className="mb-0">
          Everything uploaded for {showName} that hasn&apos;t been reviewed yet. Approve, reject
          with a reason, or ask for a replacement — approved documents leave this queue but stay
          visible on the entry.
        </ScreenLede>
      </div>

      {pendingRows.length === 0 ? (
        <Card className="p-[18px_20px_20px]">
          <p className="py-8 text-center text-[13.5px] text-[#7A8781] italic">
            Nothing waiting on review right now.
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {pendingRows.map((row) => (
            <Card key={row.key} className="p-[16px_18px]">
              <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <span className="font-semibold">{row.horseName}</span>
                  <span className="ml-2 text-[12.5px] text-[#7A8781]">{row.riderLabel}</span>
                </div>
                <StatusBadge tone="warn">
                  {row.documents.length} awaiting review
                </StatusBadge>
              </div>
              <div className="flex flex-col gap-2">
                {row.documents.map((doc) => (
                  <div
                    key={doc.requirementId}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[#EEF2F0] px-3 py-2"
                  >
                    <span className="text-[13px] font-semibold">{doc.label}</span>
                    <div className="flex items-center gap-2">
                      {doc.url && (
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[12.5px] font-semibold text-[#2E5FA8] underline"
                        >
                          View
                        </a>
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
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
