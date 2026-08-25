'use client';

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
            <TableCell className="text-ink-deep p-2 font-bold whitespace-normal">
              {row.rank}
            </TableCell>
            <TableCell className="text-ink-deep p-2 whitespace-normal">{row.rider}</TableCell>
            <TableCell className="p-2 whitespace-normal text-[#5A6B63]">{row.horse}</TableCell>
            <TableCell className="text-ink-deep p-2 text-right font-mono font-semibold whitespace-normal">
              {row.pct.toFixed(3)}%
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
