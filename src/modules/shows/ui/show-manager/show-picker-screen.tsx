'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatDateShort } from '@/shared/lib/format/date';
import { SHOW_STAGES } from '@/shared/constants/show-stages';
import { cn } from '@/shared/lib/utils';
import {
  CardTitle,
  EmptyState,
  FA_BTN,
  FA_BTN_DANGER,
  FA_BTN_PRIMARY,
  FA_BTN_SMALL,
  FA_MUTED,
  FaCard,
  PageHeader,
  Pill,
  type PillTone,
} from '@/shared/ui/organizer/fa-page';
import type { ShowPickerSummary } from '@/modules/shows/data/queries';
import type { ShowCompleteness } from '@/modules/shows/data/setup-queries';
import { approvalTone, percent } from '@/modules/staff/ui/dashboard-format';
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

export function ShowPickerScreen({ orgName, rows }: { orgName: string; rows: ShowPickerRow[] }) {
  const [openShowId, setOpenShowId] = useState<string | null>(null);
  const openRow = rows.find((r) => r.show.id === openShowId);

  return (
    <div className="text-ink-deep font-[family-name:var(--font-ar)]">
      <PageHeader
        eyebrow="Pick a show to set it up, schedule it and run it"
        title="Show Manager"
        actions={
          <>
            <Link href="/dashboard/completed" prefetch={false} className={FA_BTN}>
              Completed shows
            </Link>
            <NewShowButton className={FA_BTN_PRIMARY} />
          </>
        }
      />

      <div className="flex flex-col gap-2.5">
        {rows.map(({ show, completeness }) => {
          const items = completeness.sections.flatMap((s) => s.items);
          const setupPct = completeness.complete
            ? 100
            : percent(items.filter((i) => i.ok).length, items.length);
          const tone = approvalTone(setupPct);
          const missing = completeness.sections.filter((s) => !s.ok).length;
          const ref = show.slug ?? show.id;
          const stageLabel = SHOW_STAGES.find((s) => s.key === show.stage)?.label ?? 'Live';

          return (
            <FaCard
              key={show.id}
              tone={show.published && show.stage === 'live' ? 'live' : 'default'}
              className="flex flex-wrap items-center gap-x-5 gap-y-3"
            >
              <div className="min-w-[220px] flex-1">
                <CardTitle>{show.name}</CardTitle>
                <p className={cn(FA_MUTED, 'mt-0.5')}>
                  {show.dateLabel ??
                    (show.startDate ? formatDateShort(show.startDate) : 'Dates TBD')}
                  {show.venueName ? ` · ${show.venueName}` : ''}
                </p>
              </div>

              <div className="w-[200px] max-w-full">
                <div className={cn('text-[12.5px] font-bold', tone.text)}>
                  Setup {setupPct === null ? '—' : `${String(setupPct)}%`}
                </div>
                <div className="mt-1 h-[7px] rounded bg-[#EDF0EE]">
                  {setupPct !== null && (
                    <i
                      className={cn('block h-[7px] rounded', tone.bar)}
                      style={{ width: `${String(setupPct)}%` }}
                    />
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {show.published ? (
                  <Pill tone={STAGE_TONE[show.stage] ?? 'grey'} live={show.stage === 'live'}>
                    {stageLabel}
                  </Pill>
                ) : (
                  <Pill tone="grey">Not on sale yet</Pill>
                )}

                {!completeness.complete && (
                  <button
                    type="button"
                    title="See what's missing"
                    onClick={() => {
                      setOpenShowId(show.id);
                    }}
                    className={FA_BTN_SMALL}
                  >
                    {missing > 0 ? `${String(missing)} missing` : 'Incomplete'}
                  </button>
                )}

                <Link
                  href={
                    show.published ? `/dashboard/shows/${ref}/run-show` : `/dashboard/shows/${ref}`
                  }
                  prefetch={false}
                  className={FA_BTN_PRIMARY}
                >
                  Open →
                </Link>

                {!show.published && (
                  <DeleteShowButton
                    showId={show.id}
                    showName={show.name}
                    triggerClassName={FA_BTN_DANGER}
                  />
                )}
              </div>
            </FaCard>
          );
        })}

        {rows.length === 0 && (
          <EmptyState
            title="No shows yet"
            note={`Create one to get started — ${orgName} has nothing scheduled.`}
          />
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
