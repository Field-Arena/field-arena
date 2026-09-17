'use client';

import { Fragment, useMemo, useState } from 'react';
import { Input } from '@/shared/ui/shadcn/input';
import { Table, TableBody, TableCell, TableRow } from '@/shared/ui/shadcn/table';
import { formatMoneyExact } from '@/shared/lib/format/currency';
import { aggregateByProduct } from '@/modules/sales/utils/aggregate-by-product';
import type { SaleRow } from '@/modules/sales/types';

export function ByProductView({ rows, canViewMoney }: { rows: SaleRow[]; canViewMoney: boolean }) {
  const [search, setSearch] = useState('');
  const groups = useMemo(() => aggregateByProduct(rows), [rows]);

  const q = search.trim().toLowerCase();
  const filteredGroups = q
    ? groups
        .map((g) => ({ ...g, rows: g.rows.filter((r) => r.label.toLowerCase().includes(q)) }))
        .filter((g) => g.rows.length > 0)
    : groups;

  const grandTotalQty = groups.reduce((sum, g) => sum + g.qty, 0);
  const grandTotalRevenue = groups.reduce((sum, g) => sum + g.revenue, 0);

  return (
    <div>
      <Input
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
        }}
        placeholder="Search entry fees, qualifications, add-ons, vendor items…"
        className="mb-3 h-auto w-full rounded-[10px] border-[#D9E1DD] px-3.5 py-2.5 text-sm outline-none focus-visible:ring-0"
      />
      {filteredGroups.length === 0 ? (
        <p className="px-1 py-8 text-center text-[13px] text-[#98A29D]">
          {groups.length === 0
            ? 'No paid sales yet for this show.'
            : 'No products match your search.'}
        </p>
      ) : (
        <Table className="text-[13.5px]">
          <TableBody>
            {filteredGroups.map((g) => (
              <Fragment key={g.group}>
                <TableRow key={`${g.group}-head`} className="hover:bg-transparent">
                  <TableCell
                    colSpan={canViewMoney ? 3 : 2}
                    className="pt-4 pb-1 text-[11px] font-bold tracking-[.06em] text-[#6E7C76] uppercase"
                  >
                    {g.group}
                  </TableCell>
                </TableRow>
                {g.rows.map((r) => (
                  <TableRow key={`${g.group}-${r.label}`} className="border-b border-[#EEF2F0]">
                    <TableCell className="px-3 py-2 whitespace-normal">{r.label}</TableCell>
                    <TableCell className="px-3 py-2 text-right">{r.qty}</TableCell>
                    {canViewMoney && (
                      <TableCell className="px-3 py-2 text-right">
                        {formatMoneyExact(r.revenue)}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                <TableRow
                  key={`${g.group}-total`}
                  className="border-b border-[#E9EDEB] hover:bg-transparent"
                >
                  <TableCell className="px-3 py-1.5 text-[12.5px] font-semibold text-[#6E7C76]">
                    {g.group} total
                  </TableCell>
                  <TableCell className="px-3 py-1.5 text-right text-[12.5px] font-semibold">
                    {g.qty}
                  </TableCell>
                  {canViewMoney && (
                    <TableCell className="px-3 py-1.5 text-right text-[12.5px] font-semibold">
                      {formatMoneyExact(g.revenue)}
                    </TableCell>
                  )}
                </TableRow>
              </Fragment>
            ))}
            <TableRow className="hover:bg-transparent">
              <TableCell className="px-3 py-2.5 font-bold">Total</TableCell>
              <TableCell className="px-3 py-2.5 text-right font-bold">{grandTotalQty}</TableCell>
              {canViewMoney && (
                <TableCell className="px-3 py-2.5 text-right font-bold">
                  {formatMoneyExact(grandTotalRevenue)}
                </TableCell>
              )}
            </TableRow>
          </TableBody>
        </Table>
      )}
    </div>
  );
}
