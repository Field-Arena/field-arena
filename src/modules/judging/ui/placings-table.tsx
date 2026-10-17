'use client';

import { Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/shared/lib/utils';
import {
  FA_MUTED,
  FA_TABLE,
  FA_TABLE_WRAP,
  FA_TD,
  FA_TH,
  FA_THEAD_ROW,
  FA_TR,
} from '@/shared/ui/organizer/fa-page';
import { rankPlacings, type PlacingRow } from '@/modules/judging/utils/rank-placings';
import type { ClassPlacingEntry } from '@/modules/judging/data/queries';

export function PlacingsTable({
  entries,
  linkBase,
}: {
  entries: ClassPlacingEntry[];
  linkBase?: string;
}) {
  const router = useRouter();
  const rows = rankPlacings(entries);

  if (rows.length === 0) {
    return <p className={FA_MUTED}>No confirmed scores yet.</p>;
  }

  // Test of Choice: riders in this class rode different tests, so ribbons are
  // awarded per test, not across the whole class. Only show the grouping
  // header when there's actually more than one test in play — an ordinary
  // class (every testName null) renders exactly as before.
  const distinctTests = new Set(rows.map((r) => r.testName ?? ''));
  const isMultiTest = distinctTests.size > 1;

  const goToEntry = (entryId: string) => {
    if (linkBase) router.push(`${linkBase}/${entryId}`);
  };

  return (
    <div className={FA_TABLE_WRAP}>
      <table className={FA_TABLE}>
        <thead>
          <tr className={FA_THEAD_ROW}>
            <th className={FA_TH}>Place</th>
            <th className={FA_TH}>Rider</th>
            <th className={FA_TH}>Horse</th>
            <th className={cn(FA_TH, 'text-right')}>Score</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row: PlacingRow, i) => {
            const showTestHeader =
              isMultiTest && (i === 0 || rows[i - 1]?.testName !== row.testName);
            return (
              <Fragment key={row.entryId}>
                {showTestHeader && (
                  <tr className={FA_TR}>
                    <td
                      colSpan={4}
                      className="bg-[#F5F7F6] px-3 py-2 text-[11px] font-bold tracking-[.06em] text-[#1A5B3C] uppercase"
                    >
                      {row.testName ?? 'Test not recorded'}
                    </td>
                  </tr>
                )}
                <tr
                  className={cn(FA_TR, linkBase && 'cursor-pointer hover:bg-[#F5F7F6]')}
                  onClick={
                    linkBase
                      ? () => {
                          goToEntry(row.entryId);
                        }
                      : undefined
                  }
                >
                  <td className={cn(FA_TD, 'font-bold text-[#0D2C23]')}>{row.rank}</td>
                  <td className={cn(FA_TD, 'font-semibold text-[#0D2C23]')}>{row.rider}</td>
                  <td className={cn(FA_TD, 'text-[#5A6B63]')}>{row.horse}</td>
                  <td className={cn(FA_TD, 'text-right font-mono font-semibold text-[#0D2C23]')}>
                    {row.pct.toFixed(3)}%
                  </td>
                </tr>
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
