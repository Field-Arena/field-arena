import * as React from 'react';
import { cn } from '@/shared/lib/utils';

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
        'overflow-x-auto rounded-[14px] border border-[#E7EAEE] bg-white',
        'shadow-[0_1px_2px_rgba(16,24,40,.05)]',
        className,
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
      className="grid gap-3.5 border-b border-[#EEF1F4] bg-[#FBFCFD] px-5 py-3"
      style={{ gridTemplateColumns: template, minWidth }}
    >
      {columns.map((c) => (
        <span
          key={c.label}
          className={cn(
            'text-[11px] font-semibold tracking-[.07em] whitespace-nowrap text-[#8A94A3] uppercase',
            c.align === 'right' && 'text-right',
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
        'grid items-center gap-3.5 border-b border-[#EEF1F4] px-5 py-3.5 text-[13.5px] text-[#475467]',
        'transition-colors duration-100 hover:bg-[#FAFBFC]',
        className,
      )}
      style={{ gridTemplateColumns: template, minWidth }}
    >
      {children}
    </div>
  );
}

export function TableFooterNote({ children }: { children: React.ReactNode }) {
  return <div className="px-5 py-[13px] text-[12.5px] text-[#8A94A3]">{children}</div>;
}

export function TableEmpty({ children }: { children: React.ReactNode }) {
  return <div className="px-5 py-[30px] text-center text-[13.5px] text-[#8A94A3]">{children}</div>;
}
