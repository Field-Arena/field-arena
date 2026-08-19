'use client';

import { useRef, useState } from 'react';
import { Button } from '@/shared/ui/shadcn/button';
import { Input } from '@/shared/ui/shadcn/input';
import type { ShowExpense } from '@/modules/shows/data/setup-queries';
import { useSaveShowExpenses } from '@/modules/shows/hooks/use-expense-mutations';
import { SM_ROW_INPUT, SM_GHOST_BTN } from '@/modules/shows/ui/show-manager/tokens';

export function ExpenseEditor({ showId, expenses }: { showId: string; expenses: ShowExpense[] }) {
  const [rows, setRows] = useState(expenses);
  const [draft, setDraft] = useState('');

  const save = useSaveShowExpenses();

  const nextId = useRef(0);

  function commit(next: ShowExpense[]) {
    setRows(next);
    save.mutate({ showId, expenses: next });
  }

  function add() {
    nextId.current += 1;
    const id = `exp-new-${String(nextId.current)}`;
    commit([...rows, { id, label: draft.trim(), amount: 0 }]);
    setDraft('');
  }

  return (
    <div>
      <p className="mb-3 text-[12.5px] text-[#6E7C76]">
        The most common horse-show cost lines, pre-filled — edit amounts, rename, or remove any that
        don&apos;t apply.
      </p>

      <div className="flex flex-col gap-1.5">
        {rows.map((row, index) => (
          <div key={row.id} className="flex items-center gap-2">
            <Input
              className={`${SM_ROW_INPUT} h-auto min-w-[200px] flex-1`}
              value={row.label}
              placeholder="Expense"
              onChange={(e) => {
                const next = [...rows];
                next[index] = { ...row, label: e.target.value };
                setRows(next);
              }}
              onBlur={() => {
                commit(rows.map((r) => ({ ...r, label: r.label.trim() })));
              }}
              aria-label={`${row.label} name`}
            />
            <Input
              type="number"
              min={0}
              step="0.01"
              className={`${SM_ROW_INPUT} h-auto w-[120px] flex-none text-right`}
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
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                commit(rows.filter((r) => r.id !== row.id));
              }}
              className="h-auto flex-none rounded-[9px] border border-[#E4B5AC] bg-[#FDF0EE] px-3.5 py-2.5 text-[12.5px] font-semibold text-[#B4432F] transition-colors hover:border-[#B4432F] hover:bg-transparent"
            >
              Remove
            </Button>
          </div>
        ))}
      </div>

      <div className="mt-2.5 flex gap-2">
        <Input
          className={`${SM_ROW_INPUT} h-auto flex-1`}
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
        <Button
          type="button"
          variant="ghost"
          className={`${SM_GHOST_BTN} h-auto hover:bg-transparent`}
          onClick={add}
        >
          + Add expense
        </Button>
      </div>
    </div>
  );
}
