'use client';

import { cn } from '@/shared/lib/utils';
import { formatDateShort } from '@/shared/lib/format/date';
import { useVerifyHorseDocument } from '@/modules/shows/hooks/use-horses-mutations';
import type { HorseDocumentStatus } from '@/modules/shows/data/horses-queries';

/**
 * One document requirement's status for one horse. Color is the actual
 * signal, matching showstaff.html's horseDocCellHtml: red for anything wrong
 * (not uploaded, or uploaded but expired), amber for uploaded-and-current-
 * but-still-needs-a-human-look, green once it's actually cleared.
 */
export function HorseDocumentLine({
  doc,
  showId,
  horseId,
}: {
  doc: HorseDocumentStatus;
  showId: string;
  horseId: string | null;
}) {
  const verify = useVerifyHorseDocument();

  const colorClass =
    !doc.uploaded || doc.expired
      ? 'text-status-danger'
      : doc.needsApproval
        ? 'text-status-warn'
        : 'text-status-success';

  const suffix = !doc.uploaded
    ? 'missing'
    : doc.requiresExpiration && doc.expirationDate
      ? doc.expired
        ? `expired ${formatDateShort(doc.expirationDate)}`
        : formatDateShort(doc.expirationDate)
      : null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 text-[12px]">
      <span className={cn('font-bold', colorClass)}>
        {doc.label}:{suffix ? ` ${suffix}` : ''}
      </span>
      {doc.uploaded && doc.url && (
        <a
          href={doc.url}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:border-gold rounded-md border border-[#D9E1DD] px-2 py-0.5 text-[11px] font-semibold text-[#0D2C23] transition-colors"
        >
          View Doc
        </a>
      )}
      {doc.uploaded && doc.requiresApproval && horseId && (
        <input
          type="checkbox"
          title="Verified"
          checked={doc.verified}
          disabled={verify.isPending}
          onChange={(e) => {
            verify.mutate({
              showId,
              horseId,
              requirementId: doc.requirementId,
              verified: e.target.checked,
            });
          }}
          className="size-[15px] accent-[#1A5B3C]"
        />
      )}
    </div>
  );
}
