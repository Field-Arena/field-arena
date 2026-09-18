'use client';

import { useMemo, useState } from 'react';
import { PrinterIcon } from 'lucide-react';
import { ScreenTitle, ScreenLede, Card } from '@/shared/ui/organizer/card';
import { GhostButton } from '@/shared/ui/organizer/buttons';
import type { EntryLedgerPageData } from '@/modules/shows/data/entry-ledger-queries';
import type { TestPrintPageData } from '@/modules/shows/data/test-print-queries';
import { EntryLedgerPrintView } from '@/modules/shows/ui/filing-cabinet/print/entry-ledger-print-view';
import { NumberCardsPrintView } from '@/modules/shows/ui/filing-cabinet/print/number-cards-print-view';
import { TestPrintView } from '@/modules/shows/ui/filing-cabinet/print/test-print-view';

type PrintJob = 'ledger' | 'numberCards' | 'testCopies';

export function PrintCenterScreen({
  data,
  testPrintData,
}: {
  data: EntryLedgerPageData;
  testPrintData: TestPrintPageData | null;
}) {
  const { showName, rows } = data;
  const [job, setJob] = useState<PrintJob | null>(null);
  const [dayFilter, setDayFilter] = useState('');
  const [ringFilter, setRingFilter] = useState('');

  const testRows = useMemo(() => testPrintData?.rows ?? [], [testPrintData]);
  const days = useMemo(
    () => [...new Set(testRows.map((r) => r.date).filter((d): d is string => !!d))].sort(),
    [testRows],
  );
  const rings = useMemo(
    () => [...new Set(testRows.map((r) => r.location).filter((l): l is string => !!l))].sort(),
    [testRows],
  );
  const filteredTestRows = useMemo(
    () =>
      testRows.filter(
        (r) => (!dayFilter || r.date === dayFilter) && (!ringFilter || r.location === ringFilter),
      ),
    [testRows, dayFilter, ringFilter],
  );

  function runPrint(next: PrintJob) {
    setJob(next);
    // Let the print-only view render before the print dialog opens.
    requestAnimationFrame(() => {
      window.print();
    });
  }

  return (
    <div className="text-ink-deep font-[family-name:var(--font-ar)]">
      <div className="mb-4 print:hidden">
        <ScreenTitle className="mb-1.5">Print Center</ScreenTitle>
        <ScreenLede className="mb-0">
          Print the entry ledger or entry/bridle/back number cards for {showName}.
        </ScreenLede>
      </div>

      {rows.length === 0 ? (
        <Card className="p-[18px_20px_20px] print:hidden">
          <p className="py-8 text-center text-[13.5px] text-[#7A8781] italic">
            Nothing to print yet — entries appear once riders check out.
          </p>
        </Card>
      ) : (
        <div className="flex flex-wrap gap-3 print:hidden">
          <GhostButton
            onClick={() => {
              runPrint('ledger');
            }}
          >
            <PrinterIcon className="size-4" aria-hidden />
            Print Entry Ledger ({rows.length})
          </GhostButton>
          <GhostButton
            onClick={() => {
              runPrint('numberCards');
            }}
          >
            <PrinterIcon className="size-4" aria-hidden />
            Print Number Cards ({rows.length})
          </GhostButton>
        </div>
      )}

      {testRows.length > 0 && (
        <Card className="mt-4 p-[18px_20px_20px] print:hidden">
          <h2 className="mb-3 text-[14px] font-bold">Test copy counts</h2>
          <div className="mb-3 flex flex-wrap gap-3">
            <select
              value={dayFilter}
              onChange={(e) => {
                setDayFilter(e.target.value);
              }}
              className="rounded-lg border border-[#D9E1DD] px-3 py-2 text-[13px]"
              aria-label="Filter by day"
            >
              <option value="">All days</option>
              {days.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <select
              value={ringFilter}
              onChange={(e) => {
                setRingFilter(e.target.value);
              }}
              className="rounded-lg border border-[#D9E1DD] px-3 py-2 text-[13px]"
              aria-label="Filter by ring"
            >
              <option value="">All rings</option>
              {rings.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <GhostButton
            onClick={() => {
              runPrint('testCopies');
            }}
          >
            <PrinterIcon className="size-4" aria-hidden />
            Print Test Copy Counts ({filteredTestRows.length})
          </GhostButton>
        </Card>
      )}

      {job === 'ledger' && <EntryLedgerPrintView showName={showName} rows={rows} />}
      {job === 'numberCards' && <NumberCardsPrintView showName={showName} rows={rows} />}
      {job === 'testCopies' && <TestPrintView showName={showName} rows={filteredTestRows} />}
    </div>
  );
}
