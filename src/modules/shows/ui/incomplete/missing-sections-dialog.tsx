'use client';

import Link from 'next/link';
import { IconCheck, IconX, IconChevronRight } from '@/shared/ui/organizer/icons';
import type { CompletenessSection } from '../../data/setup-queries';

/**
 * Per-show breakdown behind the "INCOMPLETE" badge on the Incomplete Shows
 * list — real per-section completeness (see getShowCompleteness in
 * data/setup-queries.ts).
 *
 * Every section is a one-tap jump straight to the card that owns it: the six
 * Setup cards deep-link by anchor (#show-details, #venue, …, matching the
 * ids in shows/[showId]/page.tsx), Select Events and Staffing go to their own
 * pages. Unmapped names fall back to the Setup page.
 */
export function MissingSectionsDialog({
  showId,
  showName,
  sections,
  onClose,
}: {
  showId: string;
  showName: string;
  sections: CompletenessSection[];
  onClose: () => void;
}) {
  const base = `/dashboard/shows/${showId}`;
  const targets: Record<string, string> = {
    'Show Details': `${base}#show-details`,
    Venue: `${base}#venue`,
    'Class Divisions': `${base}#class-divisions`,
    'Select Events': `${base}/select-events`,
    'Required Documents': `${base}#required-documents`,
    'Merchandise Sales': `${base}#merchandise`,
    Staffing: `/dashboard/users`,
    'Waiver of Liability': `${base}#waiver`,
  };
  const hrefFor = (name: string) => targets[name] ?? base;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[78] grid place-items-center bg-[rgba(9,26,21,.42)] p-8"
    >
      <div
        onClick={(e) => {
          e.stopPropagation();
        }}
        className="max-h-[86vh] w-[min(530px,100%)] overflow-y-auto rounded-[14px] bg-white px-[26px] pb-[22px] pt-6 shadow-[0_30px_70px_rgba(9,26,21,.3)]"
      >
        <div className="flex items-start gap-3.5">
          <h2 className="mb-[7px] min-w-0 flex-1 font-[Newsreader,serif] text-[23px] font-semibold tracking-[-.015em] text-[#0D2C23]">
            {showName}
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="grid size-8 flex-none place-items-center rounded-lg border border-[#E2E8E4] bg-white text-[#5A6B63] transition-colors hover:border-[#C9A227] hover:text-[#0D2C23]"
          >
            <IconX size={14} strokeWidth={2.6} />
          </button>
        </div>

        <p className="mb-[18px] text-[13.5px] leading-[1.5] text-[#5A6B63] [text-wrap:pretty]">
          Tap any section to jump straight to it — the ones marked{' '}
          <IconX size={12} className="inline text-[#B4432F]" /> still need finishing.
        </p>

        <div className="flex flex-col gap-0.5">
          {sections.map((sec) => {
            const missing = sec.items.filter((i) => !i.ok).map((i) => i.label);
            return (
              <Link
                key={sec.name}
                href={hrefFor(sec.name)}
                onClick={onClose}
                className="flex items-center gap-[11px] rounded-md px-2 py-[9px] text-left transition-colors hover:bg-[#F4F7F5]"
              >
                {sec.ok ? (
                  <IconCheck size={15} className="flex-none text-[#2E7048]" />
                ) : (
                  <IconX size={15} className="flex-none text-[#B4432F]" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-[#16261F]">{sec.name}</span>
                  {!sec.ok && missing.length > 0 && (
                    <span className="block text-[12px] text-[#8A968F]">{missing.join(', ')}</span>
                  )}
                </span>
                <IconChevronRight className="flex-none text-[#9AA6A0]" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
