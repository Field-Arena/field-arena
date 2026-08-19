'use client';

import { useState } from 'react';
import { PrinterIcon } from 'lucide-react';
import { Button } from '@/shared/ui/shadcn/button';
import { Card } from '@/shared/ui/organizer/card';
import { cn } from '@/shared/lib/utils';
import { formatMoneyExact } from '@/shared/lib/format/currency';
import type { ShowPnl } from '@/modules/shows/data/setup-queries';
import { SM_CARD_PAD, SM_GHOST_BTN } from '@/modules/shows/ui/show-manager/tokens';
import { RevenueBreakdown } from '@/modules/shows/ui/financial/revenue-breakdown';
import { ExpenseEditor } from '@/modules/shows/ui/financial/expense-editor';

const TITLE = 'font-[family-name:var(--font-nr)] text-[17px] font-semibold text-forest';

export function PnlPanel({ pnl, canViewMoney }: { pnl: ShowPnl; canViewMoney: boolean }) {
  const [revenueOpen, setRevenueOpen] = useState(true);
  const [expensesOpen, setExpensesOpen] = useState(false);

  return (
    <>
      <Card className={SM_CARD_PAD}>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setRevenueOpen((v) => !v);
          }}
          aria-expanded={revenueOpen}
          className="flex h-auto w-full items-center justify-between gap-2.5 px-0 py-0 text-left hover:bg-transparent"
        >
          <span
            className={TITLE}
            title="Every paid rider, vendor and merchandise sale for this show"
          >
            Revenue
          </span>
          <span className="flex items-center gap-3">
            <b className="text-[16px]">{formatMoneyExact(pnl.revenueTotal)}</b>
            <span className="text-[11px] whitespace-nowrap text-[#7A8781]">
              {revenueOpen ? 'Hide ▲' : 'By category ▼'}
            </span>
          </span>
        </Button>

        {revenueOpen && (
          <div className="mt-2.5">
            <RevenueBreakdown pnl={pnl} />
          </div>
        )}
      </Card>

      <Card className={SM_CARD_PAD}>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setExpensesOpen((v) => !v);
          }}
          aria-expanded={expensesOpen}
          className="flex h-auto w-full items-center justify-between gap-2.5 px-0 py-0 text-left hover:bg-transparent"
        >
          <span
            className={TITLE}
            title="Real-world costs of running this show — venue, judges, insurance, etc."
          >
            Expenses
          </span>
          <span className="flex items-center gap-3">
            <b className="text-[16px]">{formatMoneyExact(pnl.expensesTotal)}</b>
            <span className="text-[11px] whitespace-nowrap text-[#7A8781]">
              {expensesOpen ? 'Hide ▲' : 'Show detail ▼'}
            </span>
          </span>
        </Button>

        {expensesOpen && (
          <div className="mt-2.5">
            <ExpenseEditor showId={pnl.showId} expenses={pnl.expenses} />
          </div>
        )}
      </Card>

      <Card className={cn(SM_CARD_PAD, 'flex flex-wrap items-center justify-between gap-2.5')}>
        <div className="flex items-center gap-3">
          <span className={TITLE} title="Revenue minus expenses for this show">
            Net
          </span>
          <b className="text-[20px]" style={{ color: pnl.net < 0 ? '#a33' : '#1A5B3C' }}>
            {formatMoneyExact(pnl.net)}
            {pnl.net < 0 && (
              <span className="ml-1 text-[12px] font-bold tracking-[.3px]">(LOSS)</span>
            )}
          </b>
        </div>

        {canViewMoney && (
          <Button
            type="button"
            variant="ghost"
            className={cn(SM_GHOST_BTN, 'h-auto hover:bg-transparent print:hidden')}
            onClick={() => {
              window.print();
            }}
          >
            <PrinterIcon className="size-4" aria-hidden />
            Print P&amp;L
          </Button>
        )}
      </Card>
    </>
  );
}
