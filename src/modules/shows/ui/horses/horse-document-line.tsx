'use client';

import { useState } from 'react';
import { cn } from '@/shared/lib/utils';
import { formatDateShort } from '@/shared/lib/format/date';
import { useVerifyHorseDocument } from '@/modules/shows/hooks/use-horses-mutations';
import type { HorseDocumentStatus } from '@/modules/shows/data/horses-queries';

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

  // doc.verified only flips once router.refresh() finishes re-fetching the
  // whole page -- a real delay when staff are clicking through many
  // documents in a row during check-in. Flip instantly, revert on error.
  const [optimisticVerified, setOptimisticVerified] = useState<boolean | null>(null);
  const [prevVerified, setPrevVerified] = useState(doc.verified);
  if (doc.verified !== prevVerified) {
    setPrevVerified(doc.verified);
    setOptimisticVerified(null);
  }
  const isVerified = optimisticVerified ?? doc.verified;

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
          checked={isVerified}
          disabled={verify.isPending}
          onChange={(e) => {
            const next = e.target.checked;
            setOptimisticVerified(next);
            verify.mutate(
              { showId, horseId, requirementId: doc.requirementId, verified: next },
              { onError: () => { setOptimisticVerified(null); } },
            );
          }}
          className="size-[15px] accent-[#1A5B3C]"
        />
      )}
    </div>
  );
}
