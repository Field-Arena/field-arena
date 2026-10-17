'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { DashboardTodo, TodoPriority } from '@/modules/shows/types';

const PRIORITY: Record<TodoPriority, { label: string; className: string }> = {
  urgent: { label: 'Urgent', className: 'bg-[var(--fa-red-tint)] text-[var(--fa-red)]' },
  soon: { label: 'Soon', className: 'bg-[var(--fa-amber-tint)] text-[var(--fa-amber)]' },
  later: { label: 'Later', className: 'bg-[var(--fa-line-soft)] text-[var(--fa-ink-2)]' },
};

/** The running to-do list: the most urgent few, expandable to everything. */
export function TodoList({ todos, limit = 5 }: { todos: DashboardTodo[]; limit?: number }) {
  const [expanded, setExpanded] = useState(false);

  if (todos.length === 0) {
    return <p className="m-0 py-2 text-[13px] text-[var(--fa-ink-3)]">Nothing to do right now.</p>;
  }

  const visible = expanded ? todos : todos.slice(0, limit);

  return (
    <div>
      <ul className="m-0 list-none p-0">
        {visible.map((todo) => {
          const p = PRIORITY[todo.priority];
          return (
            <li
              key={todo.key}
              className="flex items-center gap-3 border-b border-[var(--fa-line-soft)] py-2.5 last:border-b-0"
            >
              <span
                className={`flex-none rounded-md px-2 py-0.5 text-[11px] font-semibold ${p.className}`}
              >
                {p.label}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-medium text-[var(--fa-ink)]">{todo.label}</div>
                <div className="text-[12px] text-[var(--fa-ink-3)]">{todo.detail}</div>
              </div>
              <Link
                href={todo.href}
                prefetch={false}
                className="fa-btn fa-btn-ghost fa-btn-sm flex-none"
              >
                {todo.actionLabel}
              </Link>
            </li>
          );
        })}
      </ul>
      {todos.length > limit && (
        <button
          type="button"
          className="mt-1 cursor-pointer border-0 bg-transparent p-0 py-1.5 text-[12.5px] font-medium text-[var(--fa-brand)]"
          onClick={() => {
            setExpanded((v) => !v);
          }}
        >
          {expanded ? `Show top ${String(limit)} only` : `Show all ${String(todos.length)} items`}
        </button>
      )}
    </div>
  );
}
