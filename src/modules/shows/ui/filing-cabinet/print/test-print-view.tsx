'use client';

import type { TestPrintRow } from '@/modules/shows/data/test-print-queries';

export function TestPrintView({ showName, rows }: { showName: string; rows: TestPrintRow[] }) {
  if (rows.length === 0) return null;

  return (
    <div data-print-report className="hidden p-10 print:block">
      <h1 className="text-[26px] font-bold">{showName} — Test Copy Counts</h1>
      <p className="mb-4 text-sm text-[#555]">
        {rows.length} classes · printed {new Date().toLocaleDateString()}
      </p>
      <table className="w-full border-collapse text-[12px]">
        <thead>
          <tr className="border-b-2 border-[#333] text-left">
            <th className="py-1 pr-2">Class</th>
            <th className="py-1 pr-2">Test</th>
            <th className="py-1 pr-2">Day</th>
            <th className="py-1 pr-2">Ring</th>
            <th className="py-1 pr-2">Rides</th>
            <th className="py-1 pr-2">Judges</th>
            <th className="py-1 pr-2">Working copies</th>
            <th className="py-1 pr-2">+ Blank</th>
            <th className="py-1 pr-2">Total copies</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.classId} className="border-b border-[#DDD]" style={{ pageBreakInside: 'avoid' }}>
              <td className="py-1 pr-2">{row.classLabel}</td>
              <td className="py-1 pr-2">
                {row.testName ?? '—'}
                {row.testEdition ? ` (${row.testEdition})` : ''}
              </td>
              <td className="py-1 pr-2">{row.date ?? '—'}</td>
              <td className="py-1 pr-2">{row.location ?? '—'}</td>
              <td className="py-1 pr-2">{row.rideCount}</td>
              <td className="py-1 pr-2">{row.judgeCount}</td>
              <td className="py-1 pr-2">{row.workingCopies}</td>
              <td className="py-1 pr-2">{row.blankCopies}</td>
              <td className="py-1 pr-2 font-bold">{row.totalCopies}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
