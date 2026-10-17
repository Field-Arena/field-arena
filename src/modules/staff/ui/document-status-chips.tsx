import type { ShowDocumentSummary } from '@/modules/shows/types';

const chip = 'inline-block rounded-md px-2 py-0.5 text-[11.5px] font-semibold';

/** Where a show's rider documents stand, as a row of small chips. */
export function DocumentStatusChips({ documents }: { documents: ShowDocumentSummary }) {
  const { problem, awaitingReview, notUploaded } = documents;

  if (problem + awaitingReview + notUploaded === 0) {
    return (
      <span className={`${chip} bg-[var(--fa-emerald-tint)] text-[var(--fa-emerald)]`}>
        Documents all confirmed
      </span>
    );
  }

  return (
    <span className="flex flex-wrap gap-1.5">
      {problem > 0 && (
        <span className={`${chip} bg-[var(--fa-red-tint)] text-[var(--fa-red)]`}>
          {problem} problem
        </span>
      )}
      {awaitingReview > 0 && (
        <span className={`${chip} bg-[var(--fa-red-tint)] text-[var(--fa-red)]`}>
          {awaitingReview} waiting review
        </span>
      )}
      {notUploaded > 0 && (
        <span className={`${chip} bg-[var(--fa-amber-tint)] text-[var(--fa-amber)]`}>
          {notUploaded} not uploaded
        </span>
      )}
    </span>
  );
}
