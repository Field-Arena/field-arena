import type { ShowDocumentSummary } from '@/modules/shows/types';

const chip = 'inline-flex items-center rounded-lg px-2.5 py-1 text-[13px] font-bold';

/** Where a show's rider documents stand, as a row of chips. */
export function DocumentStatusChips({ documents }: { documents: ShowDocumentSummary }) {
  const { problem, awaitingReview, notUploaded } = documents;

  if (problem + awaitingReview + notUploaded === 0) {
    return <span className={`${chip} bg-[#E9F4EE] text-[#1A5B3C]`}>✓ Documents all confirmed</span>;
  }

  return (
    <span className="flex flex-wrap gap-2">
      {problem > 0 && (
        <span className={`${chip} bg-[#FDEEEB] text-[#98341F]`}>{problem} problem</span>
      )}
      {awaitingReview > 0 && (
        <span className={`${chip} bg-[#FDEEEB] text-[#98341F]`}>
          {awaitingReview} waiting review
        </span>
      )}
      {notUploaded > 0 && (
        <span className={`${chip} bg-[#FCF3E4] text-[#8A6D14]`}>{notUploaded} not uploaded</span>
      )}
    </span>
  );
}
