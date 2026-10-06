import * as React from 'react';
import { cn } from '@/shared/lib/utils';

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
        'inline-flex items-center gap-[5px] rounded-full py-[3px] pr-[9px] pl-2',
        'border text-[11px] font-semibold whitespace-nowrap',
        className,
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
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#E7EAEE] bg-[#FBFCFD] px-[11px] py-1.5 text-[12px] font-medium text-[#475467]">
      {children}
    </span>
  );
}
