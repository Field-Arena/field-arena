'use client';

import { useState } from 'react';
import { cn } from '@/shared/lib/utils';
import { formatMoneyExact } from '@/shared/lib/format/currency';
import { CardTitle, FA_BTN_SMALL, FaCard } from '@/shared/ui/organizer/fa-page';
import type { ShowPnl } from '@/modules/shows/types';
import { RevenueBreakdown } from '@/modules/shows/ui/financial/revenue-breakdown';
import { ExpenseEditor } from '@/modules/shows/ui/financial/expense-editor';

const ROW = 'flex flex-wrap items-center justify-between gap-2.5 border-t border-[#EDF0EE] py-3';

export function PnlPanel({ pnl }: { pnl: ShowPnl }) {
  const [revenueOpen, setRevenueOpen] = useState(true);
  const [expensesOpen, setExpensesOpen] = useState(false);

  return (
    <FaCard>
      <CardTitle className="mb-2">Profit &amp; loss</CardTitle>

      <div className={ROW}>
        <span
          className="flex items-center gap-2 text-[14px] font-bold"
          title="Every paid rider, vendor and merchandise sale for this show"
        >
          Revenue
          <button
            type="button"
            className={FA_BTN_SMALL}
            aria-expanded={revenueOpen}
            onClick={() => {
              setRevenueOpen((v) => !v);
            }}
          >
            {revenueOpen ? 'Hide ▴' : 'By category ▾'}
          </button>
        </span>
        <b className="text-[15px]">{formatMoneyExact(pnl.revenueTotal)}</b>
      </div>
      {revenueOpen && (
        <div className="pb-3">
          <RevenueBreakdown pnl={pnl} />
        </div>
      )}

      <div className={ROW}>
        <span
          className="flex items-center gap-2 text-[14px] font-bold"
          title="Real-world costs of running this show — venue, judges, insurance, etc."
        >
          Expenses
          <button
            type="button"
            className={FA_BTN_SMALL}
            aria-expanded={expensesOpen}
            onClick={() => {
              setExpensesOpen((v) => !v);
            }}
          >
            {expensesOpen ? 'Done ▴' : 'Edit ▾'}
          </button>
        </span>
        <b className="text-[15px]">
          {pnl.expensesTotal > 0 ? '−' : ''}
          {formatMoneyExact(pnl.expensesTotal)}
        </b>
      </div>
      {expensesOpen && (
        <div className="pb-3">
          <ExpenseEditor showId={pnl.showId} expenses={pnl.expenses} />
        </div>
      )}

      <div className={cn(ROW, 'border-t-[1.5px] border-[#C9D3CE]')}>
        <span className="text-[16px] font-bold" title="Revenue minus expenses for this show">
          Net
        </span>
        <b className={cn('text-[20px]', pnl.net < 0 ? 'text-[#B4432F]' : 'text-[#1A5B3C]')}>
          {formatMoneyExact(pnl.net)}
          {pnl.net < 0 && (
            <span className="ml-1 text-[12px] font-bold tracking-[.3px]">(LOSS)</span>
          )}
        </b>
      </div>
    </FaCard>
  );
}
