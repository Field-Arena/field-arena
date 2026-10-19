import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';

/* Shared building blocks for every workspace page — organizer, show staff,
 * judge/scribe, announcer and vendor — so they all read the same:
 * Fraunces headline, outlined count boxes, filter chips, outlined tables and
 * colored pills. Colors match the approved dashboard/Horses/Users designs. */

export const FA_BTN =
  'inline-flex cursor-pointer items-center gap-1.5 rounded-[9px] border-2 border-[#1A5B3C] bg-white px-3.5 py-2 text-[13.5px] font-bold whitespace-nowrap text-[#1A5B3C] no-underline transition-colors hover:bg-[#E9F4EE] disabled:cursor-not-allowed disabled:opacity-50';
export const FA_BTN_PRIMARY =
  'inline-flex cursor-pointer items-center gap-1.5 rounded-[9px] border-2 border-[#1A5B3C] bg-[#1A5B3C] px-3.5 py-2 text-[13.5px] font-bold whitespace-nowrap text-white no-underline transition-colors hover:bg-[#0D2C23] disabled:cursor-not-allowed disabled:opacity-50';
export const FA_BTN_SMALL =
  'inline-flex cursor-pointer items-center gap-1 rounded-[8px] border-[1.5px] border-[#1A5B3C] bg-white px-2.5 py-1 text-[12.5px] font-bold whitespace-nowrap text-[#1A5B3C] no-underline hover:bg-[#E9F4EE] disabled:cursor-not-allowed disabled:opacity-50';
export const FA_BTN_DANGER =
  'inline-flex cursor-pointer items-center gap-1 rounded-[8px] border-[1.5px] border-[#98341F] bg-white px-2.5 py-1 text-[12.5px] font-bold whitespace-nowrap text-[#98341F] no-underline hover:bg-[#FDEEEB] disabled:cursor-not-allowed disabled:opacity-50';

export const FA_INPUT =
  'text-ink-deep rounded-[10px] border-2 border-[#C9D3CE] bg-white px-3 py-2 text-[14px] outline-none focus-visible:border-[#1A5B3C]';
export const FA_SELECT =
  'text-ink-deep max-w-full rounded-[10px] border-2 border-[#C9D3CE] bg-white px-3 py-2 text-[13.5px] font-semibold outline-none focus-visible:border-[#1A5B3C]';

/* Tables: wrap in FA_TABLE_WRAP; header row FA_TH; cells FA_TD. */
export const FA_TABLE_WRAP =
  'overflow-x-auto rounded-[14px] border-[1.5px] border-[#C9D3CE] bg-white';
export const FA_TABLE = 'w-full border-collapse text-[13.5px]';
export const FA_THEAD_ROW =
  'bg-[#F5F7F6] text-left text-[11px] tracking-[.06em] text-[#5A6B63] uppercase';
export const FA_TH = 'px-3 py-2.5 font-bold';
export const FA_TR = 'border-t border-[#EDF0EE]';
export const FA_TD = 'px-3 py-3 align-middle';

export const FA_MUTED = 'text-[13px] font-semibold text-[#5A6B63]';

export function PageHeader({
  eyebrow,
  title,
  actions,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mb-4 flex flex-wrap items-end justify-between gap-3', className)}>
      <div className="min-w-0">
        {eyebrow && <p className="text-[13.5px] font-semibold text-[#5A6B63]">{eyebrow}</p>}
        <h1 className="mt-1 font-[family-name:var(--ws-fraunces)] text-[32px] leading-[1.1] font-bold text-[#0D2C23]">
          {title}
        </h1>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h2
      className={cn(
        'mt-5 mb-2 font-[family-name:var(--ws-fraunces)] text-[13px] font-bold tracking-[.06em] text-[#5A6B63] uppercase',
        className,
      )}
    >
      {children}
    </h2>
  );
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h3
      className={cn(
        'font-[family-name:var(--ws-fraunces)] text-[20px] leading-[1.2] font-bold text-[#0D2C23]',
        className,
      )}
    >
      {children}
    </h3>
  );
}

export type FaTone = 'default' | 'live' | 'warn' | 'dashed';

export function FaCard({
  tone = 'default',
  className,
  children,
}: {
  tone?: FaTone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        'rounded-[16px] border-[1.5px] bg-white p-[16px_18px]',
        tone === 'live' && 'border-[#1A5B3C] shadow-[0_0_0_3px_#E9F4EE]',
        tone === 'warn' && 'border-[#B4432F]',
        tone === 'dashed' && 'border-dashed border-[#C9D3CE]',
        tone === 'default' && 'border-[#C9D3CE]',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function StatGrid({ cols, children }: { cols: 2 | 3 | 4 | 5; children: ReactNode }) {
  const grid = {
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-3',
    4: 'sm:grid-cols-2 lg:grid-cols-4',
    5: 'sm:grid-cols-3 lg:grid-cols-5',
  }[cols];
  return <div className={cn('mb-4 grid grid-cols-1 gap-3', grid)}>{children}</div>;
}

export type StatTone = 'default' | 'green' | 'yellow' | 'red';
const STAT_COLOR: Record<StatTone, string> = {
  default: 'text-[#0D2C23]',
  green: 'text-[#1A5B3C]',
  yellow: 'text-[#8A6D14]',
  red: 'text-[#B4432F]',
};

export function StatBox({
  label,
  value,
  note,
  tone = 'default',
  href,
  onClick,
  active = false,
}: {
  label: ReactNode;
  value: ReactNode;
  note?: ReactNode;
  tone?: StatTone;
  href?: string;
  onClick?: () => void;
  active?: boolean;
}) {
  const box = cn(
    'block rounded-[12px] border-[1.5px] bg-white px-4 py-3 text-left no-underline',
    active ? 'border-[#1A5B3C] shadow-[0_0_0_3px_#E9F4EE]' : 'border-[#D9E1DD]',
    (href ?? onClick) && 'cursor-pointer hover:border-[#1A5B3C]',
  );
  const inner = (
    <>
      <span className="block text-[12.5px] font-semibold text-[#5A6B63]">{label}</span>
      <span className={cn('block text-[26px] leading-tight font-bold', STAT_COLOR[tone])}>
        {value}
      </span>
      {note && <span className="block text-[12px] font-semibold text-[#5A6B63]">{note}</span>}
    </>
  );
  if (href) {
    return (
      <Link href={href} prefetch={false} className={box}>
        {inner}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} aria-pressed={active} className={box}>
        {inner}
      </button>
    );
  }
  return <div className={box}>{inner}</div>;
}

export function ChipRow({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mb-3 flex flex-wrap items-center gap-2', className)}>{children}</div>;
}

export function Chip({
  active,
  onClick,
  href,
  children,
}: {
  active: boolean;
  onClick?: () => void;
  href?: string;
  children: ReactNode;
}) {
  const cls = cn(
    'cursor-pointer rounded-full border-2 px-3.5 py-1.5 text-[13px] font-bold whitespace-nowrap no-underline',
    active
      ? 'border-[#1A5B3C] bg-[#1A5B3C] text-white'
      : 'border-[#C9D3CE] bg-white text-[#0D2C23] hover:border-[#1A5B3C]',
  );
  if (href) {
    return (
      <Link href={href} prefetch={false} aria-current={active ? 'true' : undefined} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" aria-pressed={active} onClick={onClick} className={cls}>
      {children}
    </button>
  );
}

export type PillTone = 'green' | 'yellow' | 'red' | 'grey' | 'blue' | 'purple';
const PILL: Record<PillTone, string> = {
  green: 'bg-[#E9F4EE] text-[#1A5B3C]',
  yellow: 'bg-[#FCF3E4] text-[#8A6D14]',
  red: 'bg-[#FDEEEB] text-[#98341F]',
  grey: 'bg-[#EDF0EE] text-[#5A6B63]',
  blue: 'bg-[#EEF3FB] text-[#3E6FA8]',
  purple: 'bg-[#F4EEFA] text-[#6B4FA0]',
};

export function Pill({
  tone = 'grey',
  live = false,
  className,
  children,
}: {
  tone?: PillTone;
  /** Adds the pulsing-green "live" dot. */
  live?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-[7px] px-2 py-0.5 text-[11.5px] font-extrabold whitespace-nowrap',
        PILL[tone],
        className,
      )}
    >
      {live && <LiveDot />}
      {children}
    </span>
  );
}

export function LiveDot() {
  return (
    <span
      aria-hidden
      className="inline-block size-[9px] flex-none rounded-full bg-[#2F9E5B] shadow-[0_0_0_3px_#D7F0E0]"
    />
  );
}

export function EmptyState({ title, note }: { title: string; note?: ReactNode }) {
  return (
    <div className="rounded-[16px] border-[1.5px] border-dashed border-[#C9D3CE] bg-white px-6 py-10 text-center">
      <p className="text-[16px] font-bold text-[#0D2C23]">{title}</p>
      {note && <p className="mt-1 text-[13.5px] text-[#5A6B63]">{note}</p>}
    </div>
  );
}
