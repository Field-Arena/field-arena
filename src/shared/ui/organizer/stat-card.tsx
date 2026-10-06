import * as React from 'react';
import { cn } from '@/shared/lib/utils';
import { Eyebrow } from './card';

export interface StatCardProps {
  icon: React.ReactNode;
  value: string;
  label: string;
  note?: string;
  noteClassName?: string;
  tintBg: string;
  tintFg: string;
  valueClassName?: string;
  onClick?: () => void;
  /** Set when the card is wrapped in a Link (or otherwise clickable) by the
   *  caller without an onClick handler — still shows the pointer cursor. */
  clickable?: boolean;
}

export function StatCard({
  icon,
  value,
  label,
  note,
  noteClassName,
  tintBg,
  tintFg,
  valueClassName,
  onClick,
  clickable,
}: StatCardProps) {
  const hasOnClick = typeof onClick === 'function';
  const interactive = hasOnClick || Boolean(clickable);
  const Comp = hasOnClick ? 'button' : 'div';

  return (
    <Comp
      {...(hasOnClick ? { type: 'button' as const, onClick } : {})}
      className={cn(
        'flex flex-col items-start px-[17px] pt-[17px] pb-[15px] text-left',
        'rounded-[14px] border border-[#E7EAEE] bg-white',
        'shadow-[0_1px_2px_rgba(16,24,40,.05)]',
        'transition-[box-shadow,transform] duration-150 ease-out',
        interactive
          ? 'cursor-pointer hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(16,24,40,.08)]'
          : 'cursor-default',
      )}
    >
      <span
        className="mb-[13px] inline-grid size-[34px] place-items-center rounded-[9px]"
        style={{ background: tintBg, color: tintFg }}
      >
        {icon}
      </span>
      <span
        className={cn(
          'text-[26px] leading-none font-bold tracking-[-1px] text-[#101828] tabular-nums',
          valueClassName,
        )}
      >
        {value}
      </span>
      <Eyebrow className="mt-[7px]">{label}</Eyebrow>
      {note ? (
        <span className={cn('mt-1.5 text-[11.5px] text-[#8A94A3]', noteClassName)}>{note}</span>
      ) : null}
    </Comp>
  );
}
