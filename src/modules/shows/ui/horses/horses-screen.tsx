'use client';

import { useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { ScreenTitle, ScreenLede, Card } from '@/shared/ui/organizer/card';
import { StatCard } from '@/shared/ui/organizer/stat-card';
import { TableShell } from '@/shared/ui/organizer/data-table';
import { ghostButtonClass } from '@/shared/ui/organizer/buttons';
import { Button } from '@/shared/ui/shadcn/button';
import {
  IconCheckCircle,
  IconXCircle,
  IconShieldAlert,
  IconCalendarX,
  IconBarn,
} from '@/shared/ui/organizer/icons';
import { HORSE_STAT_TINTS } from '@/modules/shows/constants';
import type { HorsesPageData, HorseRow } from '@/modules/shows/data/horses-queries';
import type { StableChartSummary } from '@/modules/shows/data/stable-chart-queries';
import { AddHorseDialog } from '@/modules/shows/ui/horses/add-horse-dialog';
import { HorseTableRow } from '@/modules/shows/ui/horses/horse-table-row';
import {
  HORSES_TABLE_TEMPLATE,
  HORSES_TABLE_MIN_WIDTH,
} from '@/modules/shows/ui/horses/table-tokens';

type SortCol = 'horse' | 'stallion';

const SORT_COLUMNS: { col: SortCol; label: string }[] = [
  { col: 'horse', label: 'Horse' },
  { col: 'stallion', label: 'Stallion' },
];

const HORSE_STAT_CARDS: {
  key: keyof typeof HORSE_STAT_TINTS & keyof HorseCounts;
  icon: ReactNode;
  label: string;
}[] = [
  { key: 'complete', icon: <IconCheckCircle size={18} />, label: 'Complete' },
  { key: 'incomplete', icon: <IconXCircle size={18} />, label: 'Incomplete' },
  { key: 'needsVerification', icon: <IconShieldAlert size={18} />, label: 'Needs verification' },
  { key: 'cogginsExpired', icon: <IconCalendarX size={18} />, label: 'Coggins expired' },
];

interface HorseCounts {
  complete: number;
  incomplete: number;
  needsVerification: number;
  cogginsExpired: number;
}

export function HorsesScreen({
  data,
  stableChartSummary,
}: {
  data: HorsesPageData;

  stableChartSummary: StableChartSummary | null;
}) {
  const { showId, showName, requirements, rows } = data;
  const [sort, setSort] = useState<{ col: SortCol | null; dir: 1 | -1 }>({ col: null, dir: 1 });

  function toggleSort(col: SortCol) {
    setSort((prev) =>
      prev.col === col ? { col, dir: (prev.dir * -1) as 1 | -1 } : { col, dir: 1 },
    );
  }

  function arrow(col: SortCol) {
    if (sort.col !== col) return '';
    return sort.dir === 1 ? ' ▲' : ' ▼';
  }

  const sortedRows = useMemo(() => {
    if (!sort.col) return rows;
    const col = sort.col;
    const getter =
      col === 'horse' ? (r: HorseRow) => r.horseName : (r: HorseRow) => (r.isStallion ? 1 : 0);
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
    [rows],
  );

  return (
    <div className="text-ink-deep font-[family-name:var(--font-ar)]">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <ScreenTitle className="mb-1.5">Horses</ScreenTitle>
          <ScreenLede className="mb-0">
            Every horse entered at {showName}, one line each. View a document, check it verified,
            and the status column shows what still needs attention.
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
        {HORSE_STAT_CARDS.map(({ key, icon, label }) => (
          <StatCard
            key={key}
            icon={icon}
            value={String(counts[key])}
            label={label}
            tintBg={HORSE_STAT_TINTS[key].bg}
            tintFg={HORSE_STAT_TINTS[key].fg}
          />
        ))}
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
          <p className="py-8 text-center text-[13.5px] text-[#7A8781] italic">
            No horses entered yet — horses appear here as riders enter, when a roster is imported,
            or when you add one by hand.
          </p>
        </Card>
      ) : (
        <TableShell minWidth={HORSES_TABLE_MIN_WIDTH}>
          <div
            className="grid gap-3.5 border-b border-[#EEF2F0] px-5 py-3"
            style={{ gridTemplateColumns: HORSES_TABLE_TEMPLATE, minWidth: HORSES_TABLE_MIN_WIDTH }}
          >
            {SORT_COLUMNS.map(({ col, label }) => (
              <Button
                key={col}
                type="button"
                variant="ghost"
                className="hover:text-forest h-auto justify-start px-0 py-0 text-left text-[9.5px] font-bold tracking-[.14em] text-[#7A8781] uppercase hover:bg-transparent"
                onClick={() => {
                  toggleSort(col);
                }}
              >
                {label}
                {arrow(col)}
              </Button>
            ))}
            <span className="text-[9.5px] font-bold tracking-[.14em] text-[#7A8781] uppercase">
              Documents
            </span>
            <span className="text-[9.5px] font-bold tracking-[.14em] text-[#7A8781] uppercase" />
            <span className="text-[9.5px] font-bold tracking-[.14em] text-[#7A8781] uppercase" />
          </div>

          {sortedRows.map((row) => (
            <HorseTableRow
              key={row.key}
              row={row}
              showId={showId}
              requirementsCount={requirements.length}
            />
          ))}
        </TableShell>
      )}
    </div>
  );
}
