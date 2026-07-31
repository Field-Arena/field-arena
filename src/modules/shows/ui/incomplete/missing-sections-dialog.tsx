'use client';

import { useState } from 'react';
import Link from 'next/link';
import { IconCheck, IconX, IconChevronRight } from '@/shared/ui/organizer/icons';
import type { CompletenessSection } from '../../data/setup-queries';

/**
 * Per-show breakdown behind the "INCOMPLETE" badge on the Incomplete Shows
 * list — ported from the design export's MissingSectionsDialog, rebuilt
 * against real per-section completeness (see getShowCompleteness in
 * data/setup-queries.ts) instead of the export's static same-for-every-show
 * demo checklist.
 *
 * Every item links into the real Show Manager Setup page rather than the
 * export's smTab/showLabel store dispatch — Setup is one page today (see
 * show-manager/'s own comments on why only three of its cards are built),
 * so every link lands there; the item just tells the organizer which card
 * on that page still needs attention.
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
  const [openSection, setOpenSection] = useState<string | null>(null);

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
          Tap a section to see what&rsquo;s left, then tap any item to jump to Setup.
        </p>

        <div className="flex flex-col gap-0.5">
          {sections.map((sec) => {
            const open = openSection === sec.name;
            return (
              <div key={sec.name}>
                <button
                  type="button"
                  onClick={() => {
                    setOpenSection(open ? null : sec.name);
                  }}
                  className="flex w-full items-center gap-[11px] px-1 py-[7px] text-left text-sm font-bold text-[#16261F] transition-colors hover:text-[#0D2C23]"
                >
                  {sec.ok ? (
                    <IconCheck size={14} className="flex-none text-[#2E7048]" />
                  ) : (
                    <IconX size={14} className="flex-none text-[#B4432F]" />
                  )}
                  {sec.name}
                  <IconChevronRight
                    className={`flex-none text-[#9AA6A0] transition-transform duration-150 ease-out ${open ? 'rotate-90' : ''}`}
                  />
                </button>

                {open && (
                  <div className="flex flex-col gap-px py-0.5 pb-1.5 pl-[26px]">
                    {sec.items.map((item) => (
                      <Link
                        key={item.label}
                        href={`/dashboard/shows/${showId}`}
                        onClick={onClose}
                        className="flex items-center gap-[11px] rounded-md px-2 py-[5px] text-left text-[13.5px] text-[#3F5049] transition-colors hover:bg-[#F4F7F5] hover:text-[#0D2C23]"
                      >
                        {item.ok ? (
                          <IconCheck className="flex-none text-[#2E7048]" />
                        ) : (
                          <IconX className="flex-none text-[#B4432F]" />
                        )}
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
