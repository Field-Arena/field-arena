'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ScreenTitle, ScreenLede } from '@/shared/ui/organizer/card';
import { DangerButton, ghostButtonClass } from '@/shared/ui/organizer/buttons';
import { useDeleteShow } from '../../hooks/use-show-mutations';
import { formatDateShort } from '@/shared/lib/format/date';
import type { IncompleteShowSummary } from '../../data/queries';
import type { ShowCompleteness } from '../../data/setup-queries';
import { MissingSectionsDialog } from './missing-sections-dialog';
import { NewShowButton } from '../show-manager/new-show-button';

export interface IncompleteShowRow {
  show: IncompleteShowSummary;
  completeness: ShowCompleteness;
}

/**
 * "Incomplete Shows" — every unpublished show for the org, ported from the
 * design export's IncompleteShows.tsx. The export's rows were WS_SHOWS demo
 * data with a `live` branch (a green "Live" pill in place of Setup/Delete)
 * driven by a hardcoded show name; there's no such branch here because this
 * list is already scoped to `published = false` (see
 * listIncompleteShowsForOrg) — nothing in it can be live.
 */
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
    <div className="font-[family-name:var(--font-ar)] text-ink-deep">
      <div className="mb-3 flex items-center gap-3.5 text-[13px] text-[#7A8781]">
        <Link href="/dashboard" className={ghostButtonClass}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M11 18l-6-6 6-6" />
          </svg>
          Dashboard
        </Link>
        <span>{orgName}</span>
      </div>

      <ScreenTitle>Incomplete Shows</ScreenTitle>
      <ScreenLede>
        {rows.length} show{rows.length === 1 ? '' : 's'} still {rows.length === 1 ? 'needs' : 'need'}{' '}
        setup before they can open entries.
      </ScreenLede>

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
        {rows.map(({ show }) => (
          <div
            key={show.id}
            className="grid items-center gap-[18px] rounded-[10px] border-[1.5px] border-[#B4432F] bg-[#FAF6EC] px-[18px] py-[15px] [grid-template-columns:minmax(0,1fr)_auto]"
          >
            <div className="min-w-0">
              <div className="mb-1 font-[Newsreader,serif] text-[17px] font-semibold text-[#0D2C23]">
                {show.name}
              </div>
              <div className="text-[12.5px] text-[#7A6A5C]">
                {show.dateLabel ?? (show.startDate ? formatDateShort(show.startDate) : 'Dates TBD')}
                {show.venueName ? ` · ${show.venueName}` : ''}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setOpenShowId(show.id);
                }}
                className="flex cursor-pointer flex-col items-end gap-[3px] border-0 bg-transparent p-0"
              >
                <span className="rounded-full bg-[#B4432F] px-[11px] py-1 text-[10px] font-extrabold tracking-[.1em] text-[#FBF7EE]">
                  INCOMPLETE
                </span>
                <span className="text-[11px] italic text-[#7A6A5C]">
                  Click to see what&rsquo;s missing
                </span>
              </button>

              <Link
                href={`/dashboard/shows/${show.id}`}
                className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-[#E4B5AC] bg-[#FDF0EE] px-[17px] py-[9px] text-[13px] font-bold text-[#16261F] transition-colors hover:border-[#B4432F]"
              >
                <span className="size-1.5 rounded-full bg-[#B4432F]" />
                Setup
              </Link>
              <DeleteShowButton showId={show.id} showName={show.name} />
            </div>
          </div>
        ))}

        {rows.length === 0 && (
          <div className="rounded-[10px] border border-dashed border-[#DCE6E0] p-[26px] text-center text-[13.5px] text-[#7A8781]">
            Nothing left to finish — every show has its setup done.
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

function DeleteShowButton({ showId, showName }: { showId: string; showName: string }) {
  const { mutate, isPending } = useDeleteShow();

  return (
    <DangerButton
      disabled={isPending}
      onClick={() => {
        if (!confirm(`Delete "${showName}"? This can't be undone.`)) return;
        mutate(showId);
      }}
    >
      {isPending ? 'Deleting…' : 'Delete'}
    </DangerButton>
  );
}
