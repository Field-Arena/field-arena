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
        'flex flex-col items-start gap-3 px-[18px] pt-[17px] pb-[18px] text-left',
        'rounded-[14px] border border-[#EDF0EE] bg-white',
        'shadow-[0_1px_2px_rgba(16,40,32,.04),0_10px_26px_-16px_rgba(16,40,32,.14)]',
        'transition-[box-shadow,transform] duration-150 ease-out',
        interactive
          ? 'cursor-pointer hover:-translate-y-px hover:shadow-[0_2px_4px_rgba(16,40,32,.05),0_16px_34px_-18px_rgba(16,40,32,.2)]'
          : 'cursor-default',
      )}
    >
      <span
        className="inline-grid size-9 place-items-center rounded-[11px]"
        style={{ background: tintBg, color: tintFg }}
      >
        {icon}
      </span>
      <span
        className={cn(
          'text-[31px] leading-none font-bold tracking-[-.028em] text-[#16261F]',
          valueClassName,
        )}
      >
        {value}
      </span>
      <Eyebrow>{label}</Eyebrow>
      {note ? <span className={cn('text-xs text-[#98A29D]', noteClassName)}>{note}</span> : null}
    </Comp>
  );
}
