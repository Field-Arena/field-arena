'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ScreenTitle, ScreenLede } from '@/shared/ui/organizer/card';
import { ghostButtonClass } from '@/shared/ui/organizer/buttons';
import { Button } from '@/shared/ui/shadcn/button';
import { formatDateShort } from '@/shared/lib/format/date';
import type { IncompleteShowSummary, ShowCompleteness } from '@/modules/shows/types';
import { MissingSectionsDialog } from '@/modules/shows/ui/incomplete/missing-sections-dialog';
import { NewShowButton } from '@/modules/shows/ui/show-manager/new-show-button';
import { DeleteShowButton } from '@/modules/shows/ui/show-manager/delete-show-button';

export interface IncompleteShowRow {
  show: IncompleteShowSummary;
  completeness: ShowCompleteness;
}

export function IncompleteShowsScreen({
  orgName,
  rows,
}: {
  orgName: string;
  rows: IncompleteShowRow[];
}) {
  const [openShowId, setOpenShowId] = useState<string | null>(null);
  const openRow = rows.find((r) => r.show.id === openShowId);

  return (
    <div className="font-[family-name:var(--font-ar)] text-[#101828]">
      <div className="mb-3 flex items-center gap-3.5 text-[13px] text-[#8A94A3]">
        <Link href="/dashboard" prefetch={false} className={ghostButtonClass}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M11 18l-6-6 6-6" />
          </svg>
          Dashboard
        </Link>
        <span>{orgName}</span>
      </div>

      <ScreenTitle>Incomplete Shows</ScreenTitle>
      <ScreenLede>
        {rows.length} show{rows.length === 1 ? '' : 's'} still{' '}
        {rows.length === 1 ? 'needs' : 'need'} setup before they can open entries.
      </ScreenLede>

      <div className="mb-[18px] flex flex-wrap items-center gap-5 rounded-xl border border-[#E7EAEE] bg-[#FBFCFD] px-5 py-[18px]">
        <div className="min-w-0">
          <div className="mb-[5px] text-[15px] font-semibold tracking-[-.2px] text-[#101828]">
            Pick a show
          </div>
          <div className="text-[13px] text-[#7A6A5C]">
            Everything for one show at a time — setup, schedule, and running it live.
          </div>
        </div>
        <NewShowButton className="ml-auto" />
      </div>

      <div className="flex flex-col gap-2.5">
        {rows.map(({ show }) => (
          <div
            key={show.id}
            className="grid [grid-template-columns:minmax(0,1fr)_auto] items-center gap-[18px] rounded-[10px] border-[1.5px] border-[#B42318] bg-[#FAF6EC] px-[18px] py-[15px]"
          >
            <div className="min-w-0">
              <div className="mb-1 text-[15px] font-semibold tracking-[-.2px] text-[#101828]">
                {show.name}
              </div>
              <div className="text-[12.5px] text-[#7A6A5C]">
                {show.dateLabel ?? (show.startDate ? formatDateShort(show.startDate) : 'Dates TBD')}
                {show.venueName ? ` · ${show.venueName}` : ''}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setOpenShowId(show.id);
                }}
                className="flex h-auto cursor-pointer flex-col items-end justify-start gap-[3px] border-0 bg-transparent p-0 hover:bg-transparent"
              >
                <span className="rounded-full bg-[#B42318] px-[11px] py-1 text-[10px] font-extrabold tracking-[.1em] text-[#FFFFFF]">
                  INCOMPLETE
                </span>
                <span className="text-[11px] text-[#7A6A5C] italic">
                  Click to see what&rsquo;s missing
                </span>
              </Button>

              <Link
                href={`/dashboard/shows/${show.slug ?? show.id}`}
                prefetch={false}
                className="inline-flex items-center gap-2 rounded-full border border-[#FBCFC9] bg-[#FDF0EE] px-[17px] py-[9px] text-[13px] font-bold whitespace-nowrap text-[#101828] transition-colors hover:border-[#B42318]"
              >
                <span className="size-1.5 rounded-full bg-[#B42318]" />
                Setup
              </Link>
              <DeleteShowButton showId={show.id} showName={show.name} />
            </div>
          </div>
        ))}

        {rows.length === 0 && (
          <div className="rounded-[10px] border border-dashed border-[#DCE6E0] p-[26px] text-center text-[13.5px] text-[#8A94A3]">
            Nothing left to finish — every show has its setup done.
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
    </div>
  );
}
