import * as React from 'react';
import { cn } from '@/shared/lib/utils';

/** Ported from the Admin Console design export's SearchInput.tsx. */
export interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  containerClassName?: string;
}

export function SearchInput({ containerClassName, className, ...props }: SearchInputProps) {
  return (
    <span
      className={cn(
        'relative inline-flex flex-1 basis-[280px] items-center min-w-[240px]',
        containerClassName
      )}
    >
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#98A29D"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="pointer-events-none absolute left-[13px]"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.3-4.3" />
      </svg>
      <input
        className={cn(
          'w-full box-border rounded-[10px] border border-[#D9E1DD] bg-white',
          'py-[11px] pl-9 pr-3.5 text-[13.5px] text-[#16261F]',
          'placeholder:text-[#98A29D] focus:outline-none focus:border-[#C9A227]',
          className
        )}
        {...props}
      />
    </span>
  );
}
