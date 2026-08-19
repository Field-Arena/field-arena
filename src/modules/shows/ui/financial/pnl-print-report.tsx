import { Fragment } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
} from '@/shared/ui/shadcn/table';
import { cn } from '@/shared/lib/utils';
import { formatMoneyExact } from '@/shared/lib/format/currency';
import { PrintDate } from '@/shared/ui/print-date';
import type { ShowPnl } from '@/modules/shows/data/setup-queries';

export function PnlPrintReport({ pnl }: { pnl: ShowPnl }) {
  return (
    <div data-print-report className="hidden print:block">
      <div className="mb-4 flex items-start justify-between border-b border-black/20 pb-2">
        <div>
          <h1 className="m-0 text-[20px] font-bold">Profit &amp; Loss</h1>
          <div className="mt-0.5 text-[12px] text-[#555]">{pnl.showName}</div>
        </div>
        <PrintDate />
      </div>

      <h1 className="mt-0 mb-2 text-[16px] font-bold">Revenue</h1>

      {pnl.categories.length === 0 ? (
        <p className="text-[12px] text-[#555]">No paid sales recorded yet for this show.</p>
      ) : (
        pnl.categories.map((category) => (
          <section key={category.name} className="mb-3">
            <h2 className="mb-1 text-[14px] font-bold">
              {category.name}{' '}
              <span className="text-[12px] font-normal text-[#555]">
                {formatMoneyExact(category.subtotal)}
              </span>
            </h2>

            <Table className="w-full border-collapse text-[12px]">
              <TableHeader>
                <TableRow className="border-b border-black/20 hover:bg-transparent">
                  <TableHead className="h-auto px-0 py-1 text-left">Item</TableHead>
                  <TableHead className="h-auto px-0 py-1 text-right">Qty</TableHead>
                  <TableHead className="h-auto px-0 py-1 text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {category.subs.map((sub) => {
                  const showSubHeader = !(category.subs.length === 1 && sub.name === category.name);

                  return (
                    <Fragment key={sub.name}>
                      {showSubHeader && (
                        <TableRow className="border-0 hover:bg-transparent">
                          <TableCell colSpan={3} className="p-0 pt-2 font-bold whitespace-normal">
                            {sub.name}{' '}
                            <span className="font-normal text-[#555]">
                              — {formatMoneyExact(sub.subtotal)}
                            </span>
                          </TableCell>
                        </TableRow>
                      )}
                      {sub.items.map((item) => (
                        <TableRow
                          key={`${sub.name}-${item.label}`}
                          className="border-0 hover:bg-transparent"
                        >
                          <TableCell
                            className={cn('p-0 whitespace-normal', showSubHeader && 'pl-[18px]')}
                          >
                            {item.label}
                          </TableCell>
                          <TableCell className="p-0 text-right whitespace-normal">
                            {item.qty}
                          </TableCell>
                          <TableCell className="p-0 text-right whitespace-normal">
                            {formatMoneyExact(item.revenue)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </section>
        ))
      )}

      <Table className="w-full border-collapse text-[12px]">
        <TableFooter className="border-t-0 bg-transparent">
          <TableRow className="border-t border-b-0 border-black/20 font-bold hover:bg-transparent">
            <TableCell className="p-0 py-1 whitespace-normal">Total revenue</TableCell>
            <TableCell className="p-0 py-1 text-right whitespace-normal">
              {formatMoneyExact(pnl.revenueTotal)}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>

      <h1 className="mt-5 mb-2 text-[16px] font-bold">Expenses</h1>

      {pnl.expenses.length === 0 ? (
        <p className="text-[12px] text-[#555]">No expenses recorded yet for this show.</p>
      ) : (
        <Table className="w-full border-collapse text-[12px]">
          <TableBody>
            {pnl.expenses.map((expense) => (
              <TableRow key={expense.id} className="border-0 hover:bg-transparent">
                <TableCell className="p-0 py-0.5 whitespace-normal">{expense.label}</TableCell>
                <TableCell className="p-0 py-0.5 text-right whitespace-normal">
                  {formatMoneyExact(expense.amount)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Table className="w-full border-collapse text-[12px]">
        <TableFooter className="border-t-0 bg-transparent">
          <TableRow className="border-t border-b-0 border-black/20 font-bold hover:bg-transparent">
            <TableCell className="p-0 py-1 whitespace-normal">Total expenses</TableCell>
            <TableCell className="p-0 py-1 text-right whitespace-normal">
              {formatMoneyExact(pnl.expensesTotal)}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>

      <Table className="mt-4 w-full border-collapse text-[15px]">
        <TableFooter className="border-t-0 bg-transparent">
          <TableRow className="border-t-2 border-b-0 border-black/40 font-bold hover:bg-transparent">
            <TableCell className="p-0 py-1.5 whitespace-normal">Net</TableCell>
            <TableCell
              className="p-0 py-1.5 text-right whitespace-normal"
              style={{ color: pnl.net < 0 ? '#a33' : 'inherit' }}
            >
              {formatMoneyExact(pnl.net)}
              {pnl.net < 0 && ' (LOSS)'}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
