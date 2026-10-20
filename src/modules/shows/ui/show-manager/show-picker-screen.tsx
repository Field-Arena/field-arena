'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { MoreHorizontalIcon, SearchIcon } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import {
  Chip,
  ChipRow,
  EmptyState,
  FA_BTN,
  FA_BTN_PRIMARY,
  FA_BTN_SMALL,
  FA_INPUT,
  PageHeader,
  Pill,
  type PillTone,
} from '@/shared/ui/organizer/fa-page';
import { approvalTone } from '@/shared/ui/organizer/approval-tone';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/shadcn/dropdown-menu';
import { SHOW_LIST_GROUPS } from '@/modules/shows/constants';
import type {
  ShowCompleteness,
  ShowListGroup,
  ShowListRow,
  ShowPickerSummary,
} from '@/modules/shows/types';
import {
  buildShowListSections,
  countShowListGroups,
  toShowListRow,
} from '@/modules/shows/utils/show-list-rows';
import { MissingSectionsDialog } from '@/modules/shows/ui/incomplete/missing-sections-dialog';
import { NewShowButton } from '@/modules/shows/ui/show-manager/new-show-button';
import { DeleteShowButton } from '@/modules/shows/ui/show-manager/delete-show-button';

export interface ShowPickerRow {
  show: ShowPickerSummary;
  completeness: ShowCompleteness;
}

const STAGE_TONE: Record<string, PillTone> = {
  'sales-open': 'blue',
  'sales-closed': 'yellow',
  schedule: 'purple',
  live: 'green',
};

// One fixed column grid so status, setup and actions line up row to row.
// Keyed to the list's own width (a container query), not the window's: the
// dashboard sidebar takes ~240px, so a window-width breakpoint switched the
// columns on while the list was still too narrow for them. Narrower than
// that, each row wraps: the name on one line, status, setup and actions
// on the next.
const ROW_GRID =
  '@2xl:grid @2xl:grid-cols-[minmax(0,1fr)_140px_160px_140px] @2xl:items-center @2xl:gap-4';

/* Show Manager's list of every show: one aligned row per show, grouped
 * Live → Published → In setup → Finished, with status chips and a search.
 * Each row has a single primary action; delete, missing items and the public
 * link live in its ⋯ menu. */
export function ShowPickerScreen({ orgName, rows }: { orgName: string; rows: ShowPickerRow[] }) {
  const [filter, setFilter] = useState<ShowListGroup | 'all'>('all');
  const [query, setQuery] = useState('');
  const [missingFor, setMissingFor] = useState<ShowListRow | null>(null);
  const [deleteFor, setDeleteFor] = useState<ShowListRow | null>(null);

  const listRows = useMemo(
    () => rows.map(({ show, completeness }) => toShowListRow(show, completeness)),
    [rows],
  );
  const counts = useMemo(() => countShowListGroups(listRows), [listRows]);
  const sections = useMemo(
    () => buildShowListSections(listRows, filter, query),
    [listRows, filter, query],
  );

  function copyPublicLink(row: ShowListRow) {
    const url = `${window.location.origin}/show/${row.ref}`;
    navigator.clipboard.writeText(url).then(
      () => toast.success('Public link copied'),
      () => toast.error("Couldn't copy the link"),
    );
  }

  return (
    <div className="text-ink-deep font-[family-name:var(--font-ar)]">
      <PageHeader
        eyebrow={orgName}
        title="Shows"
        actions={
          <>
            <Link href="/dashboard/completed" prefetch={false} className={FA_BTN}>
              Completed shows
            </Link>
            <NewShowButton className={FA_BTN_PRIMARY} />
          </>
        }
      />

      {listRows.length === 0 ? (
        <EmptyState
          title="Create your first show"
          note={`${orgName} has nothing scheduled yet. Click New show to set one up.`}
        />
      ) : (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <ChipRow className="mb-0 flex-1">
              <Chip
                active={filter === 'all'}
                onClick={() => {
                  setFilter('all');
                }}
              >
                All {listRows.length}
              </Chip>
              {SHOW_LIST_GROUPS.filter((g) => counts[g.key] > 0).map((g) => (
                <Chip
                  key={g.key}
                  active={filter === g.key}
                  onClick={() => {
                    setFilter(g.key);
                  }}
                >
                  {g.chip} {counts[g.key]}
                </Chip>
              ))}
            </ChipRow>
            <label className="relative w-full sm:w-64">
              <span className="sr-only">Search shows</span>
              <SearchIcon
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#5A6B63]"
              />
              <input
                type="search"
                value={query}
                placeholder="Search shows or venues"
                onChange={(e) => {
                  setQuery(e.target.value);
                }}
                className={cn(FA_INPUT, 'w-full py-1.5 pl-9 text-[13.5px]')}
              />
            </label>
          </div>

          <div className="@container overflow-hidden rounded-[14px] border-[1.5px] border-[#C9D3CE] bg-white">
            <div
              className={cn(
                ROW_GRID,
                'hidden bg-[#F5F7F6] px-4 py-2.5 text-[11px] font-bold tracking-[.06em] text-[#5A6B63] uppercase @2xl:grid',
              )}
            >
              <span>Show</span>
              <span>Status</span>
              <span>Setup</span>
              <span className="sr-only">Actions</span>
            </div>

            {sections.length === 0 ? (
              <p className="border-t border-[#EDF0EE] px-4 py-6 text-center text-[13.5px] text-[#5A6B63]">
                {query ? <>No shows match &ldquo;{query}&rdquo;.</> : <>No shows here.</>}
              </p>
            ) : (
              sections.map((section) => (
                <section key={section.key} aria-label={section.label}>
                  <h2 className="flex items-center justify-between border-t border-[#EDF0EE] bg-white px-4 pt-3 pb-1 text-[12px] font-bold text-[#5A6B63]">
                    <span>{section.label}</span>
                    {section.key === 'setup' && (
                      <span className="font-semibold text-[#8A948F]">Not on sale yet</span>
                    )}
                  </h2>
                  <ul>
                    {section.rows.map((row) => (
                      <ShowRow
                        key={row.id}
                        row={row}
                        onShowMissing={() => {
                          setMissingFor(row);
                        }}
                        onCopyLink={() => {
                          copyPublicLink(row);
                        }}
                        onDelete={() => {
                          setDeleteFor(row);
                        }}
                      />
                    ))}
                  </ul>
                </section>
              ))
            )}
          </div>
        </>
      )}

      {missingFor && (
        <MissingSectionsDialog
          showId={missingFor.ref}
          showName={missingFor.name}
          sections={missingFor.completeness.sections}
          onClose={() => {
            setMissingFor(null);
          }}
        />
      )}

      {deleteFor && (
        <DeleteShowButton
          showId={deleteFor.id}
          showName={deleteFor.name}
          open
          onOpenChange={(open) => {
            if (!open) setDeleteFor(null);
          }}
        />
      )}
    </div>
  );
}

function ShowRow({
  row,
  onShowMissing,
  onCopyLink,
  onDelete,
}: {
  row: ShowListRow;
  onShowMissing: () => void;
  onCopyLink: () => void;
  onDelete: () => void;
}) {
  const tone = approvalTone(row.setupPct);
  const isLive = row.group === 'live';

  return (
    <li
      className={cn(
        ROW_GRID,
        'flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[#EDF0EE] px-4 py-3 transition-colors first:border-t-0 hover:bg-[#FAFBFA]',
      )}
    >
      <div className="w-full min-w-0 @2xl:w-auto">
        <Link
          href={row.primary.href}
          prefetch={false}
          className="block truncate text-[14.5px] font-bold text-[#0D2C23] no-underline hover:underline"
        >
          {row.name}
        </Link>
        <p className="truncate text-[12.5px] font-semibold text-[#5A6B63]">
          {row.when}
          {' · '}
          {row.venueName ?? <span className="text-[#8A948F]">Venue not set</span>}
        </p>
      </div>

      <div>
        <Pill tone={row.published ? (STAGE_TONE[row.stage] ?? 'grey') : 'grey'} live={isLive}>
          {row.published || row.group !== 'setup' ? row.stageLabel : 'Setup'}
        </Pill>
      </div>

      <div className="w-[170px] @2xl:w-auto">
        {row.setupComplete ? (
          <span className={cn('text-[12.5px] font-bold', tone.text)}>Ready</span>
        ) : (
          <button
            type="button"
            onClick={onShowMissing}
            title="See what's missing"
            className={cn('text-[12.5px] font-bold underline-offset-2 hover:underline', tone.text)}
          >
            {row.setupPct === null ? 'Not started' : `${String(row.setupPct)}%`}
            {row.toFinish > 0 && ` · ${String(row.toFinish)} to finish`}
          </button>
        )}
        <div
          className="mt-1 h-[6px] rounded bg-[#EDF0EE]"
          role="progressbar"
          aria-label={`${row.name} setup`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={row.setupPct ?? 0}
        >
          {row.setupPct !== null && (
            <i
              className={cn('block h-[6px] rounded', tone.bar)}
              style={{ width: `${String(row.setupPct)}%` }}
            />
          )}
        </div>
      </div>

      <div className="ml-auto flex items-center gap-1.5 @2xl:ml-0 @2xl:justify-end">
        <Link
          href={row.primary.href}
          prefetch={false}
          // Same size and style on every row, so the button sits in exactly
          // the same place whatever its label; the stage pill carries
          // "live", not the button.
          className={cn(FA_BTN_SMALL, 'w-[92px] justify-center py-1.5')}
        >
          {row.primary.label}
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={`More actions for ${row.name}`}
            className="inline-flex size-8 items-center justify-center rounded-[8px] text-[#5A6B63] hover:bg-[#EDF0EE] hover:text-[#0D2C23]"
          >
            <MoreHorizontalIcon className="size-[18px]" aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 rounded-xl border-[#E7EAEE] p-1.5">
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/shows/${row.ref}`} prefetch={false}>
                Open setup
              </Link>
            </DropdownMenuItem>
            {!row.setupComplete && (
              <DropdownMenuItem onSelect={onShowMissing}>See what&apos;s missing</DropdownMenuItem>
            )}
            {row.published && (
              <DropdownMenuItem onSelect={onCopyLink}>Copy public link</DropdownMenuItem>
            )}
            {!row.published && (
              <>
                <DropdownMenuSeparator className="bg-[#EEF1F4]" />
                <DropdownMenuItem variant="destructive" onSelect={onDelete}>
                  Delete show…
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  );
}
