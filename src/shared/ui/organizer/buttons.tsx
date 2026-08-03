import * as React from 'react';
import { cn } from '@/shared/lib/utils';

/** Ported from the Admin Console design export's Buttons.tsx. */
type Btn = React.ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * Class recipes exported separately from their <button> wrappers below, so a
 * navigation `<Link>` can wear the same look without nesting a <button>
 * inside an <a> — invalid HTML the ported components don't support (they
 * have no asChild/Slot escape hatch, unlike the shadcn Button elsewhere in
 * this codebase). Use e.g. `<Link className={ghostButtonClass}>`.
 */
export const ghostButtonClass =
  'inline-flex items-center gap-2 rounded-[10px] border border-[#D9E1DD] bg-white ' +
  'px-[15px] py-2.5 text-[13px] font-semibold text-[#0D2C23] ' +
  'transition-colors hover:border-[#C9A227]';

export const primaryButtonClass =
  'inline-flex items-center gap-[9px] rounded-[10px] bg-[#1A5B3C] px-[17px] py-[11px] ' +
  'text-[13.5px] font-bold text-white transition-colors hover:bg-[#144A30]';

/** The modal primary-action fill (Save/Add/Invite) — never used outside a dialog footer. */
export const goldButtonClass =
  'inline-flex items-center gap-[9px] rounded-[10px] bg-[#C9A227] px-[17px] py-[11px] ' +
  'text-[13.5px] font-bold text-[#16261F] transition-colors hover:bg-[#E3C566]';

export function GhostButton({ className, ...props }: Btn) {
  return <button type="button" className={cn(ghostButtonClass, className)} {...props} />;
}

export function PrimaryButton({ className, ...props }: Btn) {
  return <button type="button" className={cn(primaryButtonClass, className)} {...props} />;
}

export function GoldButton({ className, ...props }: Btn) {
  return <button type="button" className={cn(goldButtonClass, className)} {...props} />;
}

export function DangerButton({ className, ...props }: Btn) {
  return (
    <button
      type="button"
      className={cn(
        'rounded-lg bg-[#B4432F] px-[17px] py-2.5 text-[13px] font-bold text-[#FBF7EE]',
        'whitespace-nowrap transition-colors hover:bg-[#98341F]',
        className,
      )}
      {...props}
    />
  );
}

export function BackButton({ className, ...props }: Btn) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center gap-2 rounded-[10px] border border-[#D9E1DD] bg-white',
        'px-3.5 py-[9px] text-[13px] font-semibold text-[#0D2C23]',
        'transition-colors hover:border-[#C9A227]',
        className,
      )}
      {...props}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 12H5M11 18l-6-6 6-6" />
      </svg>
      Dashboard
    </button>
  );
}

export function FilterPill({ active, className, ...props }: Btn & { active?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        'rounded-full border px-[15px] py-2 text-[12.5px] font-bold transition-colors',
        active
          ? 'border-[#0D2C23] bg-[#0D2C23] text-white'
          : 'border-[#D9E1DD] bg-white text-[#0D2C23] hover:border-[#C9A227]',
        className,
      )}
      {...props}
    />
  );
}
