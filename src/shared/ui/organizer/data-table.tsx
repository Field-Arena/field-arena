import * as React from 'react';
import { cn } from '@/shared/lib/utils';

/** Ported from the Admin Console design export's DataTable.tsx. */
export function TableShell({
  className,
  minWidth = 720,
  children,
}: {
  className?: string;
  minWidth?: number;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'overflow-x-auto rounded-[14px] border border-[#EDF0EE] bg-white',
        'shadow-[0_1px_2px_rgba(16,40,32,.04),0_10px_26px_-16px_rgba(16,40,32,.14)]',
        className
      )}
      style={{ ['--table-min' as string]: `${String(minWidth)}px` }}
    >
      {children}
    </div>
  );
}

export function TableHead({
  columns,
  template,
  minWidth = 720,
}: {
  columns: { label: string; align?: 'left' | 'right' }[];
  template: string;
  minWidth?: number;
}) {
  return (
    <div
      className="grid gap-3.5 border-b border-[#EEF2F0] px-5 py-3"
      style={{ gridTemplateColumns: template, minWidth }}
    >
      {columns.map((c) => (
        <span
          key={c.label}
          className={cn(
            'text-[9.5px] font-bold uppercase tracking-[.14em] text-[#7A8781]',
            c.align === 'right' && 'text-right'
          )}
        >
          {c.label}
        </span>
      ))}
    </div>
  );
}

export function TableRow({
  template,
  minWidth = 720,
  className,
  children,
}: {
  template: string;
  minWidth?: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'grid items-center gap-3.5 border-b border-[#F1F4F3] px-5 py-3',
        'transition-colors duration-100 hover:bg-[#F8FAF9]',
        className
      )}
      style={{ gridTemplateColumns: template, minWidth }}
    >
      {children}
    </div>
  );
}

export function TableFooterNote({ children }: { children: React.ReactNode }) {
  return <div className="px-5 py-[13px] text-[12.5px] text-[#98A29D]">{children}</div>;
}

export function TableEmpty({ children }: { children: React.ReactNode }) {
  return <div className="px-5 py-[30px] text-center text-[13.5px] text-[#7A8781]">{children}</div>;
}
