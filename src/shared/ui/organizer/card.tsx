import * as React from 'react';
import { cn } from '@/shared/lib/utils';

/** Ported from the Admin Console design export's Card.tsx. */
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-[14px] border border-[#EDF0EE] bg-white',
        'shadow-[0_1px_2px_rgba(16,40,32,.04),0_10px_26px_-16px_rgba(16,40,32,.14)]',
        className
      )}
      {...props}
    />
  );
}

export function Eyebrow({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn('text-[9.5px] font-bold uppercase tracking-[.14em] text-[#6E7C76]', className)}
      {...props}
    />
  );
}

export function ScreenTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h1
      className={cn(
        'mb-1.5 font-[Newsreader,serif] text-[30px] font-semibold leading-[1.06] tracking-[-.02em] text-[#0D2C23]',
        className
      )}
      {...props}
    />
  );
}

export function ScreenLede({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn('mb-5 max-w-[760px] text-[13.5px] text-[#5A6B63] [text-wrap:pretty]', className)}
      {...props}
    />
  );
}
