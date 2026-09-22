'use client';

import type { EntryLedgerRow } from '@/modules/shows/data/entry-ledger-queries';

export function NumberCardsPrintView({ showName, rows }: { showName: string; rows: EntryLedgerRow[] }) {
  if (rows.length === 0) return null;

  return (
    <div data-print-report className="hidden print:block">
      <div className="grid grid-cols-2 gap-6 p-8">
        {rows.map((row) => (
          <div
            key={row.showEntryId}
            className="flex flex-col items-center justify-center rounded-lg border-2 border-[#333] p-6 text-center"
            style={{ pageBreakInside: 'avoid' }}
          >
            <div className="text-[11px] tracking-widest text-[#666] uppercase">{showName}</div>
            <div className="mt-2 text-[64px] leading-none font-black">{row.entryNumber}</div>
            <div className="mt-1 text-[13px] text-[#555]">Entry number</div>
            <div className="mt-4 text-[28px] leading-none font-bold">{row.bridleNumber ?? '—'}</div>
            <div className="text-[12px] text-[#555]">Bridle number</div>
            {row.backNumber && (
              <>
                <div className="mt-3 text-[22px] leading-none font-bold">{row.backNumber}</div>
                <div className="text-[11px] text-[#555]">Back number</div>
              </>
            )}
            <div className="mt-4 text-[14px] font-semibold">{row.riderName}</div>
            <div className="text-[13px] text-[#555]">{row.horseName}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
