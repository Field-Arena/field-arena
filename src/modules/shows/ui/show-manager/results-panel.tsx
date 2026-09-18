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

export function ResultsPanel({
  showName,
  rows,
  canExportRoster,
}: {
  showName: string;
  rows: ShowResultRow[];
  canExportRoster: boolean;
}) {
  const byUnit = new Map<string, ShowResultRow[]>();
  for (const row of rows) {
    const list = byUnit.get(row.unitLabel) ?? [];
    list.push(row);
    byUnit.set(row.unitLabel, list);
  }
  for (const unitRows of byUnit.values()) {
    unitRows.sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity));
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-4">
        <p className="text-[13.5px] text-[#5A6B63]">
          Every class&apos;s riders and scores, ranked per test for Test of Choice classes and
          combined for classes sharing a championship. Unscored riders are included so this
          doubles as a full roster.
        </p>
        {canExportRoster && (
          <PrimaryButton
            type="button"
            className="flex-none whitespace-nowrap"
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
        )}
      </div>

      {byUnit.size === 0 ? (
        <Card className="p-[60px_20px] text-center text-[14.5px] text-[#7A8781]">
          No classes yet.
        </Card>
      ) : (
        [...byUnit.entries()].map(([unitLabel, unitRows]) => {
          const distinctTests = new Set(unitRows.map((r) => r.testName ?? ''));
          const isMultiTest = distinctTests.size > 1;
          const pooled = unitRows[0]?.pooled ?? false;
          const pooledClasses = pooled
            ? [...new Set(unitRows.map((r) => r.className))].sort((a, b) => a.localeCompare(b))
            : [];
          return (
            <Card key={unitLabel} className="p-[16px_18px]">
              <h3 className="text-ink-deep mb-1 font-[Newsreader,serif] text-[17px] font-semibold">
                {unitLabel}
                {unitRows[0]?.division ? (
                  <span className="ml-1.5 text-[13px] font-normal text-[#7A8781]">
                    ({unitRows[0].division})
                  </span>
                ) : null}
              </h3>
              {pooled && (
                <p className="mb-2 text-[12px] text-[#7A8781]">
                  Combined placing across: {pooledClasses.join(', ')}
                </p>
              )}
              <Table className="border-collapse text-[13.5px]">
                <TableHeader className="[&_tr]:border-0">
                  <TableRow className="text-left text-[11px] tracking-[.08em] text-[#7A8781] uppercase hover:bg-transparent">
                    <TableHead className="h-auto p-2">Place</TableHead>
                    <TableHead className="h-auto p-2">Ribbon</TableHead>
                    <TableHead className="h-auto p-2">Rider</TableHead>
                    <TableHead className="h-auto p-2">Horse</TableHead>
                    {pooled && <TableHead className="h-auto p-2">Class</TableHead>}
                    {isMultiTest && <TableHead className="h-auto p-2">Test</TableHead>}
                    <TableHead className="h-auto p-2 text-right">Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unitRows.map((row) => (
                    <TableRow
                      key={row.entryId}
                      className="border-t border-b-0 border-[#E9EDEB] hover:bg-transparent"
                    >
                      <TableCell className="text-ink-deep p-2 font-bold whitespace-normal">
                        {row.rank ?? '—'}
                      </TableCell>
                      <TableCell className="p-2 whitespace-normal">
                        {row.ribbonName && (
                          <span
                            className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                            style={{ background: row.ribbonBg ?? undefined, color: row.ribbonFg ?? undefined }}
                          >
                            {row.ribbonPlace} · {row.ribbonName}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-ink-deep p-2 whitespace-normal">
                        <span className="text-[#98A29D]">#{row.num}</span> {row.rider}
                      </TableCell>
                      <TableCell className="p-2 whitespace-normal text-[#5A6B63]">
                        {row.horse}
                      </TableCell>
                      {pooled && (
                        <TableCell className="p-2 whitespace-normal text-[#5A6B63]">
                          {row.className}
                        </TableCell>
                      )}
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
