import * as React from 'react';
import { cn } from '@/shared/lib/utils';

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-[14px] border border-[#E7EAEE] bg-white',
        'shadow-[0_1px_2px_rgba(16,24,40,.05)]',
        className,
      )}
      {...props}
    />
  );
}

export function Eyebrow({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'text-[11px] font-semibold tracking-[.08em] text-[#8A94A3] uppercase',
        className,
      )}
      {...props}
    />
  );
}

export function ScreenTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h1
      className={cn(
        'mb-2 font-[family-name:var(--fa-serif)] text-[29px] leading-[1.2] font-semibold tracking-[-.5px] text-[#101828]',
        className,
      )}
      {...props}
    />
  );
}

export function ScreenLede({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        'mb-6 max-w-[640px] text-[14px] leading-[1.6] [text-wrap:pretty] text-[#475467]',
        className,
      )}
      {...props}
    />
  );
}

/** A heading for a section inside a page that already has its page title —
 * e.g. a Documents tab under the Documents page head. Sans, card-title size. */
export function SectionTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn('mb-1 text-[17px] font-semibold tracking-[-.2px] text-[#101828]', className)}
      {...props}
    />
  );
}
