'use client';

import type { ShowResultRow } from '@/modules/shows/data/queries';
import { buildResultsCsv } from '@/modules/shows/utils/build-results-csv';
import { resultsCsvFilename } from '@/modules/shows/utils/results-csv-filename';
import { Card } from '@/shared/ui/organizer/card';
import { PrimaryButton } from '@/shared/ui/organizer/buttons';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/shadcn/table';

export function ResultsPanel({ showName, rows }: { showName: string; rows: ShowResultRow[] }) {
  const byClass = new Map<string, ShowResultRow[]>();
  for (const row of rows) {
    const list = byClass.get(row.classId) ?? [];
    list.push(row);
    byClass.set(row.classId, list);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <p className="text-[13.5px] text-[#5A6B63]">
          Every class&apos;s riders and scores, ranked per test for Test of Choice classes.
          Unscored riders are included so this doubles as a full roster.
        </p>
        <PrimaryButton
          type="button"
          onClick={() => {
            const csv = buildResultsCsv(rows);
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = resultsCsvFilename(showName);
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }}
        >
          Export CSV
        </PrimaryButton>
      </div>

      {byClass.size === 0 ? (
        <Card className="p-[60px_20px] text-center text-[14.5px] text-[#7A8781]">
          No classes yet.
        </Card>
      ) : (
        [...byClass.entries()].map(([classId, classRows]) => {
          const distinctTests = new Set(classRows.map((r) => r.testName ?? ''));
          const isMultiTest = distinctTests.size > 1;
          return (
            <Card key={classId} className="p-[16px_18px]">
              <h3 className="text-ink-deep mb-2 font-[Newsreader,serif] text-[17px] font-semibold">
                {classRows[0]?.className}
                {classRows[0]?.division ? (
                  <span className="ml-1.5 text-[13px] font-normal text-[#7A8781]">
                    ({classRows[0].division})
                  </span>
                ) : null}
              </h3>
              <Table className="border-collapse text-[13.5px]">
                <TableHeader className="[&_tr]:border-0">
                  <TableRow className="text-left text-[11px] tracking-[.08em] text-[#7A8781] uppercase hover:bg-transparent">
                    <TableHead className="h-auto p-2">Place</TableHead>
                    <TableHead className="h-auto p-2">Rider</TableHead>
                    <TableHead className="h-auto p-2">Horse</TableHead>
                    {isMultiTest && <TableHead className="h-auto p-2">Test</TableHead>}
                    <TableHead className="h-auto p-2 text-right">Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classRows.map((row) => (
                    <TableRow
                      key={row.entryId}
                      className="border-t border-b-0 border-[#E9EDEB] hover:bg-transparent"
                    >
                      <TableCell className="text-ink-deep p-2 font-bold whitespace-normal">
                        {row.rank ?? '—'}
                      </TableCell>
                      <TableCell className="text-ink-deep p-2 whitespace-normal">
                        {row.rider}
                      </TableCell>
                      <TableCell className="p-2 whitespace-normal text-[#5A6B63]">
                        {row.horse}
                      </TableCell>
                      {isMultiTest && (
                        <TableCell className="p-2 whitespace-normal text-[#5A6B63]">
                          {row.testName ?? '—'}
                        </TableCell>
                      )}
                      <TableCell className="text-ink-deep p-2 text-right font-mono font-semibold whitespace-normal">
                        {row.pct != null ? `${row.pct.toFixed(3)}%` : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          );
        })
      )}
    </div>
  );
}
