'use client';

import { formatMoney } from '@/shared/lib/format/currency';
import type { EntryLedgerRow } from '@/modules/shows/data/entry-ledger-queries';

export function EntryLedgerPrintView({ showName, rows }: { showName: string; rows: EntryLedgerRow[] }) {
  if (rows.length === 0) return null;

  return (
    <div data-print-report className="hidden p-10 print:block">
      <h1 className="text-[26px] font-bold">{showName} — Entry Ledger</h1>
      <p className="mb-4 text-sm text-[#555]">
        {rows.length} entries · printed {new Date().toLocaleDateString()}
      </p>
      <table className="w-full border-collapse text-[12px]">
        <thead>
          <tr className="border-b-2 border-[#333] text-left">
            <th className="py-1 pr-2">Entry #</th>
            <th className="py-1 pr-2">Bridle #</th>
            <th className="py-1 pr-2">Rider</th>
            <th className="py-1 pr-2">Horse</th>
            <th className="py-1 pr-2">Classes</th>
            <th className="py-1 pr-2">Fees</th>
            <th className="py-1 pr-2">Paid</th>
            <th className="py-1 pr-2">Balance</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.showEntryId} className="border-b border-[#DDD]" style={{ pageBreakInside: 'avoid' }}>
              <td className="py-1 pr-2">{row.entryNumber}</td>
              <td className="py-1 pr-2">{row.bridleNumber}</td>
              <td className="py-1 pr-2">{row.riderName}</td>
              <td className="py-1 pr-2">{row.horseName}</td>
              <td className="py-1 pr-2">{row.classes.join(', ')}</td>
              <td className="py-1 pr-2">{formatMoney(row.fees)}</td>
              <td className="py-1 pr-2">{formatMoney(row.amountPaid)}</td>
              <td className="py-1 pr-2">{formatMoney(row.balance)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
