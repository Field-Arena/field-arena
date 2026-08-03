import { Fragment } from 'react';
import { formatMoneyExact } from '@/shared/lib/format/currency';
import { PrintDate } from './print-date';
import type { ShowPnl } from '../../data/setup-queries';

/**
 * The printed Profit & Loss, ported from pnlGenerateReport.
 *
 * Rendered into the page but hidden until print, rather than assembled into a
 * scratch element on click the way the legacy build did — same output, and it
 * cannot drift from what the screen shows because both read one `pnl`.
 *
 * Revenue leads and is broken all the way down — business category (the big
 * subtotal) → subcategory (itemised, its own subtotal) → line items with qty —
 * ending in one "Total revenue" line. That order is the organizer's own stated
 * P&L format, not a flat revenue row with the detail buried underneath.
 *
 * The date is stamped by the browser at print time rather than on the server:
 * a server-rendered date would be the moment the page was fetched, which for a
 * cached render can be hours off what the person printing it expects.
 */
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

            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr className="border-b border-black/20">
                  <th className="py-1 text-left">Item</th>
                  <th className="py-1 text-right">Qty</th>
                  <th className="py-1 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {category.subs.map((sub) => {
                  const showSubHeader = !(
                    category.subs.length === 1 && sub.name === category.name
                  );

                  return (
                    <Fragment key={sub.name}>
                      {showSubHeader && (
                        <tr>
                          <td colSpan={3} className="pt-2 font-bold">
                            {sub.name}{' '}
                            <span className="font-normal text-[#555]">
                              — {formatMoneyExact(sub.subtotal)}
                            </span>
                          </td>
                        </tr>
                      )}
                      {sub.items.map((item) => (
                        <tr key={`${sub.name}-${item.label}`}>
                          <td className={showSubHeader ? 'pl-[18px]' : undefined}>{item.label}</td>
                          <td className="text-right">{item.qty}</td>
                          <td className="text-right">{formatMoneyExact(item.revenue)}</td>
                        </tr>
                      ))}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </section>
        ))
      )}

      <table className="w-full border-collapse text-[12px]">
        <tfoot>
          <tr className="border-t border-black/20 font-bold">
            <td className="py-1">Total revenue</td>
            <td className="py-1 text-right">{formatMoneyExact(pnl.revenueTotal)}</td>
          </tr>
        </tfoot>
      </table>

      <h1 className="mt-5 mb-2 text-[16px] font-bold">Expenses</h1>

      {pnl.expenses.length === 0 ? (
        <p className="text-[12px] text-[#555]">No expenses recorded yet for this show.</p>
      ) : (
        <table className="w-full border-collapse text-[12px]">
          <tbody>
            {pnl.expenses.map((expense) => (
              <tr key={expense.id}>
                <td className="py-0.5">{expense.label}</td>
                <td className="py-0.5 text-right">{formatMoneyExact(expense.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <table className="w-full border-collapse text-[12px]">
        <tfoot>
          <tr className="border-t border-black/20 font-bold">
            <td className="py-1">Total expenses</td>
            <td className="py-1 text-right">{formatMoneyExact(pnl.expensesTotal)}</td>
          </tr>
        </tfoot>
      </table>

      {/* The report's final number — revenue's grand total minus expenses'. */}
      <table className="mt-4 w-full border-collapse text-[15px]">
        <tfoot>
          <tr className="border-t-2 border-black/40 font-bold">
            <td className="py-1.5">Net</td>
            <td className="py-1.5 text-right" style={{ color: pnl.net < 0 ? '#a33' : 'inherit' }}>
              {formatMoneyExact(pnl.net)}
              {pnl.net < 0 && ' (LOSS)'}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
