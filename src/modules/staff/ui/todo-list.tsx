'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { DashboardTodo, TodoPriority } from '@/modules/shows/types';

const PRIORITY: Record<TodoPriority, { label: string; pill: string; bar: string }> = {
  urgent: { label: 'Urgent', pill: 'bg-[#B4432F] text-white', bar: 'bg-[#B4432F]' },
  soon: { label: 'Soon', pill: 'bg-[#FCF3E4] text-[#8A6D14]', bar: 'bg-[#C9A227]' },
  later: { label: 'Later', pill: 'bg-[#EDF0EE] text-[#5A6B63]', bar: 'bg-[#D9E1DD]' },
};

/** The running to-do list: the most urgent few, expandable to everything. */
export function TodoList({ todos, limit = 5 }: { todos: DashboardTodo[]; limit?: number }) {
  const [expanded, setExpanded] = useState(false);

  if (todos.length === 0) {
    return (
      <p className="m-0 rounded-xl bg-[#E9F4EE] px-4 py-3 text-[15px] font-semibold text-[#1A5B3C]">
        ✓ Nothing to do right now.
      </p>
    );
  }

  const visible = expanded ? todos : todos.slice(0, limit);

  return (
    <div>
      <ul className="m-0 grid list-none gap-2.5 p-0">
        {visible.map((todo) => {
          const p = PRIORITY[todo.priority];
          return (
            <li
              key={todo.key}
              className="relative flex items-center gap-4 overflow-hidden rounded-xl border border-[#D9E1DD] bg-white py-3.5 pr-4 pl-5"
            >
              <span className={`absolute inset-y-0 left-0 w-1.5 ${p.bar}`} aria-hidden />
              <span
                className={`flex-none rounded-md px-2.5 py-1 text-[11.5px] font-extrabold tracking-wide uppercase ${p.pill}`}
              >
                {p.label}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[15.5px] leading-snug font-bold text-[#0D2C23]">
                  {todo.label}
                </div>
                <div className="mt-0.5 text-[13.5px] text-[#5A6B63]">{todo.detail}</div>
              </div>
              <Link
                href={todo.href}
                prefetch={false}
                className="inline-flex h-10 flex-none items-center rounded-lg border-2 border-[#1A5B3C] bg-white px-4 text-[14px] font-bold text-[#1A5B3C] no-underline transition-colors hover:bg-[#1A5B3C] hover:text-white"
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
          className="mt-3 inline-flex h-10 cursor-pointer items-center rounded-lg border-2 border-[#D9E1DD] bg-white px-4 text-[14px] font-bold text-[#16261F] hover:border-[#1A5B3C]"
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
