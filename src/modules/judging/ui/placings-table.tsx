'use client';

import { useRouter } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/shadcn/table';
import { rankPlacings, type PlacingRow } from '@/modules/judging/utils/rank-placings';
import type { ClassPlacingEntry } from '@/modules/judging/data/queries';

/**
 * Rank/rider/horse/score, ported from judge-scribe.html's `placingsTableHtml`
 * — shared by the Results view (My Assignments' inline standings) and the
 * History drill-down's second level. `linkBase` makes each row navigate to
 * that entry's scorecard when present (History); omitted, rows are plain
 * (Results, which doesn't drill further in legacy either).
 */
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

  return (
    <Table className="border-collapse text-[13.5px]">
      <TableHeader className="[&_tr]:border-0">
        <TableRow className="hover:bg-transparent text-left text-[11px] tracking-[.08em] text-[#7A8781] uppercase">
          <TableHead className="h-auto p-2">Place</TableHead>
          <TableHead className="h-auto p-2">Rider</TableHead>
          <TableHead className="h-auto p-2">Horse</TableHead>
          <TableHead className="h-auto p-2 text-right">Score</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row: PlacingRow) => (
          <TableRow
            key={row.entryId}
            className={`border-t border-b-0 border-[#E9EDEB] ${linkBase ? 'cursor-pointer hover:bg-[#F5F7F6]' : 'hover:bg-transparent'}`}
            onClick={
              linkBase
                ? () => {
                    router.push(`${linkBase}/${row.entryId}`);
                  }
                : undefined
            }
          >
            <TableCell className="whitespace-normal p-2 font-bold text-ink-deep">{row.rank}</TableCell>
            <TableCell className="whitespace-normal p-2 text-ink-deep">{row.rider}</TableCell>
            <TableCell className="whitespace-normal p-2 text-[#5A6B63]">{row.horse}</TableCell>
            <TableCell className="whitespace-normal p-2 text-right font-mono font-semibold text-ink-deep">
              {row.pct.toFixed(3)}%
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
