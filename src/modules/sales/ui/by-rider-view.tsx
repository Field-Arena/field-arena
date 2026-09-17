'use client';

import { useMemo } from 'react';
import { Table, TableBody, TableCell, TableRow } from '@/shared/ui/shadcn/table';
import { formatMoneyExact } from '@/shared/lib/format/currency';
import { aggregateByRider } from '@/modules/sales/utils/aggregate-by-rider';
import type { SaleRow } from '@/modules/sales/types';

export function ByRiderView({ rows, canViewMoney }: { rows: SaleRow[]; canViewMoney: boolean }) {
  const riders = useMemo(() => aggregateByRider(rows), [rows]);
  const total = riders.reduce((sum, r) => sum + r.total, 0);

  if (riders.length === 0) {
    return (
      <p className="px-1 py-8 text-center text-[13px] text-[#98A29D]">
        No paid rider entries yet for this show.
      </p>
    );
  }

  return (
    <Table className="text-[13.5px]">
      <TableBody>
        {riders.map((r) => (
          <TableRow key={r.rider} className="border-b border-[#EEF2F0]">
            <TableCell className="px-3 py-2.5 font-semibold whitespace-normal">{r.rider}</TableCell>
            <TableCell className="px-3 py-2.5 whitespace-normal text-[#5A6B63]">
              {r.items.join(', ') || '—'}
            </TableCell>
            {canViewMoney && (
              <TableCell className="px-3 py-2.5 text-right">{formatMoneyExact(r.total)}</TableCell>
            )}
          </TableRow>
        ))}
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={2} className="px-3 py-2.5 font-bold">
            Total
          </TableCell>
          {canViewMoney && (
            <TableCell className="px-3 py-2.5 text-right font-bold">
              {formatMoneyExact(total)}
            </TableCell>
          )}
        </TableRow>
      </TableBody>
    </Table>
  );
}
