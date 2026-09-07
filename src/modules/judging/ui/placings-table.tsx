'use client';

import { Fragment } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/shadcn/table';
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
    return <p className="text-[13px] text-[#7A8781]">No confirmed scores yet.</p>;
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
    <Table className="border-collapse text-[13.5px]">
      <TableHeader className="[&_tr]:border-0">
        <TableRow className="text-left text-[11px] tracking-[.08em] text-[#7A8781] uppercase hover:bg-transparent">
          <TableHead className="h-auto p-2">Place</TableHead>
          <TableHead className="h-auto p-2">Rider</TableHead>
          <TableHead className="h-auto p-2">Horse</TableHead>
          <TableHead className="h-auto p-2 text-right">Score</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row: PlacingRow, i) => {
          const showTestHeader =
            isMultiTest && (i === 0 || rows[i - 1]?.testName !== row.testName);
          return (
            <Fragment key={row.entryId}>
              {showTestHeader && (
                <TableRow key={`${row.testName ?? 'none'}-header`} className="hover:bg-transparent">
                  <TableCell
                    colSpan={4}
                    className="text-forest border-t border-[#E9EDEB] bg-[#F5F7F6] p-2 text-[11px] font-bold tracking-[.06em] uppercase whitespace-normal"
                  >
                    {row.testName ?? 'Test not recorded'}
                  </TableCell>
                </TableRow>
              )}
              <TableRow
                key={row.entryId}
                className={`border-t border-b-0 border-[#E9EDEB] ${linkBase ? 'cursor-pointer hover:bg-[#F5F7F6]' : 'hover:bg-transparent'}`}
                onClick={linkBase ? () => { goToEntry(row.entryId); } : undefined}
              >
                <TableCell className="text-ink-deep p-2 font-bold whitespace-normal">
                  {row.rank}
                </TableCell>
                <TableCell className="text-ink-deep p-2 whitespace-normal">{row.rider}</TableCell>
                <TableCell className="p-2 whitespace-normal text-[#5A6B63]">{row.horse}</TableCell>
                <TableCell className="text-ink-deep p-2 text-right font-mono font-semibold whitespace-normal">
                  {row.pct.toFixed(3)}%
                </TableCell>
              </TableRow>
            </Fragment>
          );
        })}
      </TableBody>
    </Table>
  );
}
