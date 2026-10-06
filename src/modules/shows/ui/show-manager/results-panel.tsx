'use client';

import Link from 'next/link';
import type { ShowResultRow } from '@/modules/shows/types';
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
        <p className="text-[13.5px] text-[#475467]">
          Every class&apos;s riders and scores, ranked per test for Test of Choice classes and
          combined for classes sharing a championship. Unscored riders are included so this doubles
          as a full roster.
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
        <Card className="p-[60px_20px] text-center text-[14.5px] text-[#8A94A3]">
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
          const distinctClasses = [
            ...new Map(unitRows.map((r) => [r.classId, r.className])).entries(),
          ];
          return (
            <Card key={unitLabel} className="p-[16px_18px]">
              <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h3 className="text-[15px] font-semibold tracking-[-.2px] text-[#101828]">
                  {unitLabel}
                  {unitRows[0]?.division ? (
                    <span className="ml-1.5 text-[13px] font-normal text-[#8A94A3]">
                      ({unitRows[0].division})
                    </span>
                  ) : null}
                </h3>
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  {distinctClasses.map(([classId, className]) => (
                    <Link
                      key={classId}
                      href={`/dashboard/scoring/${classId}`}
                      prefetch={false}
                      className="text-[12.5px] font-semibold text-[#101828] hover:underline"
                    >
                      Score{distinctClasses.length > 1 ? ` ${className}` : ''} →
                    </Link>
                  ))}
                </div>
              </div>
              {pooled && (
                <p className="mb-2 text-[12px] text-[#8A94A3]">
                  Combined placing across: {pooledClasses.join(', ')}
                </p>
              )}
              <Table className="border-collapse text-[13.5px]">
                <TableHeader className="[&_tr]:border-0">
                  <TableRow className="text-left text-[11px] tracking-[.08em] text-[#8A94A3] uppercase hover:bg-transparent">
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
                      className="border-t border-b-0 border-[#E7EAEE] hover:bg-transparent"
                    >
                      <TableCell className="p-2 font-bold whitespace-normal text-[#101828]">
                        {row.rank ?? '—'}
                      </TableCell>
                      <TableCell className="p-2 whitespace-normal">
                        {row.ribbonName && (
                          <span
                            className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                            style={{
                              background: row.ribbonBg ?? undefined,
                              color: row.ribbonFg ?? undefined,
                            }}
                          >
                            {row.ribbonPlace} · {row.ribbonName}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="p-2 whitespace-normal text-[#101828]">
                        <span className="text-[#8A94A3]">#{row.num}</span> {row.rider}
                      </TableCell>
                      <TableCell className="p-2 whitespace-normal text-[#475467]">
                        {row.horse}
                      </TableCell>
                      {pooled && (
                        <TableCell className="p-2 whitespace-normal text-[#475467]">
                          {row.className}
                        </TableCell>
                      )}
                      {isMultiTest && (
                        <TableCell className="p-2 whitespace-normal text-[#475467]">
                          {row.testName ?? '—'}
                        </TableCell>
                      )}
                      <TableCell className="p-2 text-right font-mono font-semibold whitespace-normal text-[#101828]">
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
