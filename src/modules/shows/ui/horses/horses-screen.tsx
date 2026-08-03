'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ScreenTitle, ScreenLede, Card } from '@/shared/ui/organizer/card';
import { StatCard } from '@/shared/ui/organizer/stat-card';
import { TableShell } from '@/shared/ui/organizer/data-table';
import { ghostButtonClass } from '@/shared/ui/organizer/buttons';
import {
  IconCheckCircle,
  IconXCircle,
  IconShieldAlert,
  IconCalendarX,
  IconBarn,
} from '@/shared/ui/organizer/icons';
import { cn } from '@/shared/lib/utils';
import { formatDateShort } from '@/shared/lib/format/date';
import { truncateHorseName } from '../../utils';
import { HORSE_STAT_TINTS } from '../../constants';
import { AddHorseDialog } from './add-horse-dialog';
import { useVerifyHorseDocument, useRemindHorseDocuments } from '../../hooks/use-horses-mutations';
import type { HorsesPageData, HorseRow, HorseDocumentStatus } from '../../data/horses-queries';
import type { StableChartSummary } from '../../data/stable-chart-queries';

type SortCol = 'horse' | 'stallion';

const TABLE_TEMPLATE = 'minmax(180px,1.6fr) 90px minmax(280px,2.2fr) 76px 120px';
const TABLE_MIN_WIDTH = 900;

/**
 * "Horses" — every horse entered in the show, and what paperwork is still
 * outstanding. Ported from showstaff.html's showHorsesList() (~13638-13802):
 * 4 KPI tiles, a table sortable by Horse/Stallion, one Documents cell per
 * document requirement (label, status, View Doc, verify checkbox), a big
 * check/✗ completeness column, and a per-row "✉ Remind" action.
 *
 * See modules/shows/data/horses-queries.ts for how rows are built (entry
 * roster + shows.manual_horses, cross-referenced against
 * shows.document_requirements) and horses-mutations.ts for the three writes
 * this screen makes.
 */
export function HorsesScreen({
  data,
  stableChartSummary,
}: {
  data: HorsesPageData;
  /** Null once no stable chart has been built yet — see stable-chart-queries.ts's summarizeStableChart. */
  stableChartSummary: StableChartSummary | null;
}) {
  const { showId, showName, requirements, rows } = data;
  const [sort, setSort] = useState<{ col: SortCol | null; dir: 1 | -1 }>({ col: null, dir: 1 });

  function toggleSort(col: SortCol) {
    setSort((prev) => (prev.col === col ? { col, dir: (prev.dir * -1) as 1 | -1 } : { col, dir: 1 }));
  }

  function arrow(col: SortCol) {
    if (sort.col !== col) return '';
    return sort.dir === 1 ? ' ▲' : ' ▼';
  }

  const sortedRows = useMemo(() => {
    if (!sort.col) return rows;
    const col = sort.col;
    const getter = col === 'horse' ? (r: HorseRow) => r.horseName : (r: HorseRow) => (r.isStallion ? 1 : 0);
    return [...rows].sort((a, b) => {
      const av = getter(a);
      const bv = getter(b);
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * sort.dir;
      return String(av).localeCompare(String(bv)) * sort.dir;
    });
  }, [rows, sort]);

  const counts = useMemo(
    () => ({
      complete: rows.filter((r) => r.complete).length,
      incomplete: rows.filter((r) => !r.complete).length,
      needsVerification: rows.filter((r) => r.needsVerification).length,
      cogginsExpired: rows.filter((r) => r.cogginsExpired).length,
    }),
    [rows]
  );

  return (
    <div className="font-[family-name:var(--font-ar)] text-ink-deep">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <ScreenTitle className="mb-1.5">Horses</ScreenTitle>
          <ScreenLede className="mb-0">
            Every horse entered at {showName}, one line each. View a document, check it verified, and
            the status column shows what still needs attention.
          </ScreenLede>
        </div>
        <div className="flex flex-none items-center gap-2.5">
          <Link href={`/dashboard/horses/stable-chart?show=${showId}`} className={ghostButtonClass}>
            🏠 Stable Chart
          </Link>
          <AddHorseDialog showId={showId} />
        </div>
      </div>

      <div className="mb-5 grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3">
        <StatCard
          icon={<IconCheckCircle size={18} />}
          value={String(counts.complete)}
          label="Complete"
          tintBg={HORSE_STAT_TINTS.complete.bg}
          tintFg={HORSE_STAT_TINTS.complete.fg}
        />
        <StatCard
          icon={<IconXCircle size={18} />}
          value={String(counts.incomplete)}
          label="Incomplete"
          tintBg={HORSE_STAT_TINTS.incomplete.bg}
          tintFg={HORSE_STAT_TINTS.incomplete.fg}
        />
        <StatCard
          icon={<IconShieldAlert size={18} />}
          value={String(counts.needsVerification)}
          label="Needs verification"
          tintBg={HORSE_STAT_TINTS.needsVerification.bg}
          tintFg={HORSE_STAT_TINTS.needsVerification.fg}
        />
        <StatCard
          icon={<IconCalendarX size={18} />}
          value={String(counts.cogginsExpired)}
          label="Coggins expired"
          tintBg={HORSE_STAT_TINTS.cogginsExpired.bg}
          tintFg={HORSE_STAT_TINTS.cogginsExpired.fg}
        />
        {stableChartSummary && (
          <StatCard
            icon={<IconBarn size={18} />}
            value={`${String(stableChartSummary.occupied)}/${String(stableChartSummary.total)}`}
            label="Stalls occupied"
            note={`${String(stableChartSummary.available)} available${stableChartSummary.closed ? ` · ${String(stableChartSummary.closed)} closed` : ''}`}
            tintBg={HORSE_STAT_TINTS.stallsOccupied.bg}
            tintFg={HORSE_STAT_TINTS.stallsOccupied.fg}
          />
        )}
      </div>

      {rows.length === 0 ? (
        <Card className="p-[18px_20px_20px]">
          <p className="py-8 text-center text-[13.5px] italic text-[#7A8781]">
            No horses entered yet — horses appear here as riders enter, when a roster is imported, or
            when you add one by hand.
          </p>
        </Card>
      ) : (
        <TableShell minWidth={TABLE_MIN_WIDTH}>
          <div
            className="grid gap-3.5 border-b border-[#EEF2F0] px-5 py-3"
            style={{ gridTemplateColumns: TABLE_TEMPLATE, minWidth: TABLE_MIN_WIDTH }}
          >
            <button
              type="button"
              className="text-left text-[9.5px] font-bold uppercase tracking-[.14em] text-[#7A8781] hover:text-forest"
              onClick={() => {
                toggleSort('horse');
              }}
            >
              Horse{arrow('horse')}
            </button>
            <button
              type="button"
              className="text-left text-[9.5px] font-bold uppercase tracking-[.14em] text-[#7A8781] hover:text-forest"
              onClick={() => {
                toggleSort('stallion');
              }}
            >
              Stallion{arrow('stallion')}
            </button>
            <span className="text-[9.5px] font-bold uppercase tracking-[.14em] text-[#7A8781]">
              Documents
            </span>
            <span className="text-[9.5px] font-bold uppercase tracking-[.14em] text-[#7A8781]" />
            <span className="text-[9.5px] font-bold uppercase tracking-[.14em] text-[#7A8781]" />
          </div>

          {sortedRows.map((row) => (
            <HorseTableRow key={row.key} row={row} showId={showId} requirementsCount={requirements.length} />
          ))}
        </TableShell>
      )}
    </div>
  );
}

function HorseTableRow({
  row,
  showId,
  requirementsCount,
}: {
  row: HorseRow;
  showId: string;
  requirementsCount: number;
}) {
  const remind = useRemindHorseDocuments();

  const canRemind = requirementsCount > 0 && row.missingLabels.length > 0;
  const remindDisabledReason = !row.horseId
    ? 'No document record for this horse yet'
    : !row.riderEmail
      ? 'No email on file for this rider'
      : null;

  return (
    <div
      className="grid items-start gap-3.5 border-b border-[#F1F4F3] px-5 py-3.5 transition-colors duration-100 hover:bg-[#F8FAF9]"
      style={{ gridTemplateColumns: TABLE_TEMPLATE, minWidth: TABLE_MIN_WIDTH }}
    >
      <div className="min-w-0">
        <div className="truncate text-[11.5px] italic text-[#7A8781]">{row.riderLabel}</div>
        <div className="truncate text-[15px] font-extrabold text-hunter-deep" title={row.horseName}>
          🐴 {truncateHorseName(row.horseName)}
        </div>
      </div>

      <div>
        {row.isStallion ? (
          <span className="inline-block rounded-full bg-[#F7EFD3] px-2.5 py-1 text-[11px] font-bold text-[#7A5F0F]">
            Yes
          </span>
        ) : (
          <span className="text-[12.5px] text-[#98A29D]">No</span>
        )}
      </div>

      <div className="flex flex-col gap-1.5 pt-0.5">
        {requirementsCount === 0 ? (
          <span className="text-[12.5px] text-[#98A29D]">None required</span>
        ) : (
          row.documents.map((doc) => (
            <HorseDocumentLine key={doc.requirementId} doc={doc} showId={showId} horseId={row.horseId} />
          ))
        )}
      </div>

      <div className="pt-0.5 text-center">
        {row.complete ? (
          <span className="text-status-success text-[26px] font-extrabold leading-none">✓</span>
        ) : (
          <span className="text-status-danger text-[26px] font-extrabold leading-none">✗</span>
        )}
      </div>

      <div className="pt-0.5">
        {canRemind &&
          (remindDisabledReason ? (
            <button
              type="button"
              disabled
              title={remindDisabledReason}
              className="cursor-not-allowed whitespace-nowrap rounded-[10px] border border-[#D9E1DD] bg-white px-2.5 py-1.5 text-[11.5px] font-semibold text-[#0D2C23] opacity-50"
            >
              ✉ Remind
            </button>
          ) : (
            <button
              type="button"
              disabled={remind.isPending}
              onClick={() => {
                // remindDisabledReason is only null once row.horseId is set — this branch is
                // that "active" case — but the type isn't narrowed across the two variables.
                if (row.horseId) remind.mutate({ showId, horseId: row.horseId });
              }}
              className={cn(
                'whitespace-nowrap rounded-[10px] border border-[#D9E1DD] bg-white px-2.5 py-1.5 text-[11.5px] font-semibold text-[#0D2C23] transition-colors hover:border-gold',
                remind.isPending && 'opacity-60'
              )}
            >
              {remind.isPending ? 'Sending…' : '✉ Remind'}
            </button>
          ))}
      </div>
    </div>
  );
}

/**
 * One document requirement's status for one horse. Color is the actual
 * signal, matching showstaff.html's horseDocCellHtml: red for anything wrong
 * (not uploaded, or uploaded but expired), amber for uploaded-and-current-
 * but-still-needs-a-human-look, green once it's actually cleared.
 */
function HorseDocumentLine({
  doc,
  showId,
  horseId,
}: {
  doc: HorseDocumentStatus;
  showId: string;
  horseId: string | null;
}) {
  const verify = useVerifyHorseDocument();

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
          className="rounded-md border border-[#D9E1DD] px-2 py-0.5 text-[11px] font-semibold text-[#0D2C23] transition-colors hover:border-gold"
        >
          View Doc
        </a>
      )}
      {doc.uploaded && doc.requiresApproval && horseId && (
        <input
          type="checkbox"
          title="Verified"
          checked={doc.verified}
          disabled={verify.isPending}
          onChange={(e) => {
            verify.mutate({ showId, horseId, requirementId: doc.requirementId, verified: e.target.checked });
          }}
          className="size-[15px] accent-[#1A5B3C]"
        />
      )}
    </div>
  );
}
