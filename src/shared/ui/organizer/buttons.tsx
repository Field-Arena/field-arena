import * as React from 'react';
import { cn } from '@/shared/lib/utils';

type Btn = React.ButtonHTMLAttributes<HTMLButtonElement>;

// Redesign .btn-ghost / .btn-primary (field-arena-prototype/assets/style.css).
export const ghostButtonClass =
  'inline-flex items-center gap-[7px] whitespace-nowrap rounded-[10px] border border-[#E7EAEE] bg-white ' +
  'px-[15px] py-[9px] text-[13px] font-semibold text-[#475467] shadow-[0_1px_2px_rgba(16,24,40,.05)] ' +
  'transition hover:border-[#D6DBE1] hover:bg-[#FBFCFD] hover:text-[#101828]';

export const primaryButtonClass =
  'inline-flex items-center gap-[7px] whitespace-nowrap rounded-[10px] border border-transparent bg-[#146A47] ' +
  'px-[15px] py-[9px] text-[13px] font-semibold text-white shadow-[0_1px_2px_rgba(16,80,55,.3)] ' +
  'transition hover:bg-[#0E5537] hover:shadow-[0_4px_16px_rgba(16,24,40,.08)]';

// The redesign has no gold accent — the old gold CTA reads as the primary.
export const goldButtonClass = primaryButtonClass;

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
        'rounded-[10px] bg-[#B42318] px-[15px] py-[9px] text-[13px] font-semibold text-white',
        'whitespace-nowrap transition-colors hover:bg-[#912018]',
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
        'mb-4 inline-flex items-center gap-1.5 border-0 bg-transparent py-1',
        'text-[13px] font-medium text-[#475467] transition-colors hover:text-[#146A47]',
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
        'inline-flex items-center gap-1.5 rounded-lg border px-[11px] py-1.5 text-[12px] font-medium transition-colors',
        active
          ? 'border-[#146A47] bg-[#146A47] text-white'
          : 'border-[#E7EAEE] bg-[#FBFCFD] text-[#475467] hover:border-[#CDD4DB] hover:text-[#101828]',
        className,
      )}
      {...props}
    />
  );
}
