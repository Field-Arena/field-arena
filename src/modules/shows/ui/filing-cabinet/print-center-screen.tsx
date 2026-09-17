'use client';

import { useState } from 'react';
import { PrinterIcon } from 'lucide-react';
import { ScreenTitle, ScreenLede, Card } from '@/shared/ui/organizer/card';
import { GhostButton } from '@/shared/ui/organizer/buttons';
import type { EntryLedgerPageData } from '@/modules/shows/data/entry-ledger-queries';
import { EntryLedgerPrintView } from '@/modules/shows/ui/filing-cabinet/print/entry-ledger-print-view';
import { NumberCardsPrintView } from '@/modules/shows/ui/filing-cabinet/print/number-cards-print-view';

type PrintJob = 'ledger' | 'numberCards';

export function PrintCenterScreen({ data }: { data: EntryLedgerPageData }) {
  const { showName, rows } = data;
  const [job, setJob] = useState<PrintJob | null>(null);

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

      {job === 'ledger' && <EntryLedgerPrintView showName={showName} rows={rows} />}
      {job === 'numberCards' && <NumberCardsPrintView showName={showName} rows={rows} />}
    </div>
  );
}
