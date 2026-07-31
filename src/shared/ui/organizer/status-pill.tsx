import * as React from 'react';
import { cn } from '@/shared/lib/utils';

/** Ported from the Admin Console design export's StatusPill.tsx. */
export interface StatusPillProps {
  children: React.ReactNode;
  icon?: React.ReactNode;
  bg: string;
  border: string;
  fg: string;
  className?: string;
}

export function StatusPill({ children, icon, bg, border, fg, className }: StatusPillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-[7px] rounded-full px-3 py-[5px]',
        'whitespace-nowrap border text-xs font-bold',
        className
      )}
      style={{ background: bg, borderColor: border, color: fg }}
    >
      {icon}
      {children}
    </span>
  );
}

export function CountPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-[#F2F6F4] px-3.5 py-[7px] text-[12.5px] font-semibold text-[#48574F]">
      {children}
    </span>
  );
}
