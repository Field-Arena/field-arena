'use client';

import { useState } from 'react';
import { Loader2Icon, PrinterIcon } from 'lucide-react';
import { Card } from '@/shared/ui/organizer/card';
import { cn } from '@/shared/lib/utils';
import { formatMoneyExact } from '@/shared/lib/format/currency';
import type { ShowExpense, ShowPnl } from '../../data/setup-queries';
import {
  useSaveShowExpenses,
  useSeedDefaultExpenses,
} from '../../hooks/use-expense-mutations';
import { SM_CARD_PAD, SM_ROW_INPUT, SM_GREEN_BTN, SM_GHOST_BTN } from '../show-manager/tokens';

const TITLE = 'font-[family-name:var(--font-nr)] text-[17px] font-semibold text-forest';

/**
 * Revenue → Expenses → Net, ported from showstaff.html's billingPnlHtml.
 *
 * Two accordions and a card. Revenue opens by default and Expenses does not —
 * the legacy defaults (`pnlRevenueOpen = true`, `pnlExpensesOpen = false`),
 * because revenue is the number an organizer checks first and expenses are
 * something they come back to edit.
 *
 * Net sits in its own card below both, visible whichever accordion is open.
 */
export function PnlPanel({ pnl, canViewMoney }: { pnl: ShowPnl; canViewMoney: boolean }) {
  const [revenueOpen, setRevenueOpen] = useState(true);
  const [expensesOpen, setExpensesOpen] = useState(false);

  return (
    <>
      <Card className={SM_CARD_PAD}>
        <button
          type="button"
          onClick={() => {
            setRevenueOpen((v) => !v);
          }}
          aria-expanded={revenueOpen}
          className="flex w-full items-center justify-between gap-2.5 text-left"
        >
          <span className={TITLE} title="Every paid rider, vendor and merchandise sale for this show">
            Revenue
          </span>
          <span className="flex items-center gap-3">
            <b className="text-[16px]">{formatMoneyExact(pnl.revenueTotal)}</b>
            <span className="text-[11px] whitespace-nowrap text-[#7A8781]">
              {revenueOpen ? 'Hide ▲' : 'By category ▼'}
            </span>
          </span>
        </button>

        {revenueOpen && (
          <div className="mt-2.5">
            <RevenueBreakdown pnl={pnl} />
          </div>
        )}
      </Card>

      <Card className={SM_CARD_PAD}>
        <button
          type="button"
          onClick={() => {
            setExpensesOpen((v) => !v);
          }}
          aria-expanded={expensesOpen}
          className="flex w-full items-center justify-between gap-2.5 text-left"
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
        </button>

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
          <b
            className="text-[20px]"
            style={{ color: pnl.net < 0 ? '#a33' : '#1A5B3C' }}
          >
            {formatMoneyExact(pnl.net)}
            {pnl.net < 0 && (
              <span className="ml-1 text-[12px] font-bold tracking-[.3px]">(LOSS)</span>
            )}
          </b>
        </div>

        {/* Matches pnlGenerateReport's own guard: a ShowAdmin without money
            permission is refused the report rather than shown a blank one. */}
        {canViewMoney && (
          <button
            type="button"
            className={cn(SM_GHOST_BTN, 'print:hidden')}
            onClick={() => {
              window.print();
            }}
          >
            <PrinterIcon className="size-4" aria-hidden />
            Print P&amp;L
          </button>
        )}
      </Card>
    </>
  );
}

function RevenueBreakdown({ pnl }: { pnl: ShowPnl }) {
  if (pnl.categories.length === 0) {
    return (
      <p className="text-[12.5px] text-[#7A8781]">No paid sales recorded yet for this show.</p>
    );
  }

  return (
    <>
      <p className="mb-3 text-[12.5px] text-[#6E7C76]">
        Every paid line item for this show, grouped by category and subcategory.
      </p>

      <div className="flex flex-col gap-4">
        {pnl.categories.map((category) => (
          <div key={category.name}>
            <div className="flex items-center justify-between border-b border-[#E9EDEB] pb-1.5 text-[13px] font-bold text-forest">
              <span>{category.name}</span>
              <span>{formatMoneyExact(category.subtotal)}</span>
            </div>

            {category.subs.map((sub) => {
              // The legacy view hides a subcategory header when it would only
              // repeat the category name it sits under.
              const showSubHeader = !(category.subs.length === 1 && sub.name === category.name);

              return (
                <div key={sub.name} className="mt-2">
                  {showSubHeader && (
                    <div className="flex items-center justify-between text-[12.5px] font-semibold text-[#5A6B63]">
                      <span>{sub.name}</span>
                      <span>{formatMoneyExact(sub.subtotal)}</span>
                    </div>
                  )}
                  <div className="mt-1 flex flex-col gap-0.5">
                    {sub.items.map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center justify-between gap-2 text-[12.5px] text-[#5A6B63]"
                      >
                        <span className="min-w-0 truncate">{item.label}</span>
                        <span className="flex flex-none items-center gap-2">
                          <span className="text-[11.5px] text-[#98A29D]">×{item.qty}</span>
                          <span className="font-semibold text-ink-deep">
                            {formatMoneyExact(item.revenue)}
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-[#E9EDEB] pt-2.5 text-[13.5px] font-bold text-forest">
        <span>Total revenue</span>
        <span>{formatMoneyExact(pnl.revenueTotal)}</span>
      </div>
    </>
  );
}

/**
 * The editable cost lines.
 *
 * Every change rewrites the whole list — shows.expenses is a jsonb array, so
 * there is no element-level update to make. Local state is what is on screen;
 * a commit sends the list it produces.
 */
function ExpenseEditor({ showId, expenses }: { showId: string; expenses: ShowExpense[] }) {
  const [rows, setRows] = useState(expenses);
  const [draft, setDraft] = useState('');

  const save = useSaveShowExpenses();
  const seed = useSeedDefaultExpenses();

  function commit(next: ShowExpense[]) {
    setRows(next);
    save.mutate({ showId, expenses: next });
  }

  function add() {
    const label = draft.trim();
    if (!label) return;
    // Time-free id: the legacy expenseId() used a timestamp, which cannot be
    // generated during render here without breaking hydration.
    const id = `exp-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}-${String(rows.length)}`;
    commit([...rows, { id, label, amount: 0 }]);
    setDraft('');
  }

  if (rows.length === 0) {
    return (
      <div>
        <p className="mb-3 text-[13px] italic text-[#98A29D]">
          No expenses recorded yet for this show.
        </p>
        <button
          type="button"
          className={SM_GREEN_BTN}
          disabled={seed.isPending}
          onClick={() => {
            seed.mutate(showId);
          }}
        >
          {seed.isPending && <Loader2Icon className="size-4 animate-spin" aria-hidden />}
          Add the common cost lines
        </button>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-3 text-[12.5px] text-[#6E7C76]">
        The most common horse-show cost lines, pre-filled — edit amounts, rename, or remove any
        that don&apos;t apply.
      </p>

      <div className="flex flex-col gap-1.5">
        {rows.map((row, index) => (
          <div key={row.id} className="flex items-center gap-2">
            <input
              className={`${SM_ROW_INPUT} min-w-[200px] flex-1`}
              value={row.label}
              placeholder="Expense"
              onChange={(e) => {
                const next = [...rows];
                next[index] = { ...row, label: e.target.value };
                setRows(next);
              }}
              onBlur={() => {
                commit(rows);
              }}
              aria-label={`${row.label} name`}
            />
            <input
              type="number"
              min={0}
              step="0.01"
              className={`${SM_ROW_INPUT} w-[120px] flex-none text-right`}
              value={row.amount}
              onChange={(e) => {
                const next = [...rows];
                next[index] = { ...row, amount: Number(e.target.value) || 0 };
                setRows(next);
              }}
              onBlur={() => {
                commit(rows);
              }}
              aria-label={`${row.label} amount`}
            />
            <button
              type="button"
              onClick={() => {
                commit(rows.filter((r) => r.id !== row.id));
              }}
              className="flex-none rounded-[9px] border border-[#E4B5AC] bg-[#FDF0EE] px-3.5 py-2.5 text-[12.5px] font-semibold text-[#B4432F] transition-colors hover:border-[#B4432F]"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="mt-2.5 flex gap-2">
        <input
          className={`${SM_ROW_INPUT} flex-1`}
          placeholder="Add another expense…"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          aria-label="New expense name"
        />
        <button type="button" className={SM_GHOST_BTN} onClick={add} disabled={!draft.trim()}>
          + Add expense
        </button>
      </div>
    </div>
  );
}
