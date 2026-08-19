'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ScreenTitle, ScreenLede } from '@/shared/ui/organizer/card';
import { formatDateShort } from '@/shared/lib/format/date';
import { SHOW_STAGES } from '@/shared/constants/show-stages';
import { Button } from '@/shared/ui/shadcn/button';
import type { ShowPickerSummary } from '@/modules/shows/data/queries';
import type { ShowCompleteness } from '@/modules/shows/data/setup-queries';
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
    <div className="text-ink-deep font-[family-name:var(--font-ar)]">
      <ScreenTitle>Show Manager</ScreenTitle>
      <ScreenLede>Set up, schedule, and run your show — start to finish.</ScreenLede>

      <div className="mb-[18px] flex flex-wrap items-center gap-5 rounded-xl border border-[#E7E0D0] bg-[#F8F5EC] px-5 py-[18px]">
        <div className="min-w-0">
          <div className="mb-[5px] font-[Newsreader,serif] text-[19px] font-semibold text-[#0D2C23]">
            Pick a show
          </div>
          <div className="text-[13px] text-[#7A6A5C]">
            Everything for one show at a time — setup, schedule, and running it live.
          </div>
        </div>
        <NewShowButton className="ml-auto" />
      </div>

      <div className="flex flex-col gap-2.5">
        {rows.map(({ show, completeness }) => {
          const complete = completeness.complete;

          return (
            <div
              key={show.id}
              className="grid [grid-template-columns:minmax(0,1fr)_auto] items-center gap-[18px] rounded-[10px] border-[1.5px] bg-[#FAF6EC] px-[18px] py-[15px]"
              style={{
                borderColor: show.published ? '#E9EDEB' : '#B4432F',
                borderLeft: show.published ? '4px solid #2E7048' : '1.5px solid #B4432F',
              }}
            >
              <div className="min-w-0">
                <div className="mb-1 font-[Newsreader,serif] text-[17px] font-semibold text-[#0D2C23]">
                  {show.name}
                </div>
                <div className="text-[12.5px] text-[#7A6A5C]">
                  {show.dateLabel ??
                    (show.startDate ? formatDateShort(show.startDate) : 'Dates TBD')}
                  {show.venueName ? ` · ${show.venueName}` : ''}
                </div>
              </div>

              <div className="flex items-center gap-3">
                {!complete && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setOpenShowId(show.id);
                    }}
                    className="flex h-auto cursor-pointer flex-col items-end gap-[3px] border-0 bg-transparent p-0 hover:bg-transparent"
                  >
                    <span className="rounded-full bg-[#B4432F] px-[11px] py-1 text-[10px] font-extrabold tracking-[.1em] text-[#FBF7EE]">
                      INCOMPLETE
                    </span>
                    <span className="text-[11px] text-[#7A6A5C] italic">
                      Click to see what&rsquo;s missing
                    </span>
                  </Button>
                )}

                {show.published ? (
                  <Link
                    href={`/dashboard/shows/${show.id}/run-show`}
                    className="inline-flex items-center gap-[7px] rounded-full border border-[#B9D8C0] bg-[#E3F0E5] px-[15px] py-2 text-[13px] font-bold whitespace-nowrap text-[#2E7048]"
                  >
                    <span className="size-[7px] rounded-full bg-[#2E7048]" />
                    {SHOW_STAGES.find((s) => s.key === show.stage)?.label ?? 'Live'}
                  </Link>
                ) : (
                  <>
                    <Link
                      href={`/dashboard/shows/${show.id}`}
                      className="inline-flex items-center gap-2 rounded-full border border-[#E4B5AC] bg-[#FDF0EE] px-[17px] py-[9px] text-[13px] font-bold whitespace-nowrap text-[#16261F] transition-colors hover:border-[#B4432F]"
                    >
                      <span className="size-1.5 rounded-full bg-[#B4432F]" />
                      Setup
                    </Link>
                    <DeleteShowButton showId={show.id} showName={show.name} />
                  </>
                )}
              </div>
            </div>
          );
        })}

        {rows.length === 0 && (
          <div className="rounded-[10px] border border-dashed border-[#DCE6E0] p-[26px] text-center text-[13.5px] text-[#7A8781]">
            No shows yet — create one to get started. {orgName} has nothing scheduled.
          </div>
        )}
      </div>

      {openRow && (
        <MissingSectionsDialog
          showId={openRow.show.id}
          showName={openRow.show.name}
          sections={openRow.completeness.sections}
          onClose={() => {
            setOpenShowId(null);
          }}
        />
      )}
    </div>
  );
}
