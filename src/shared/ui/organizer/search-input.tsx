import * as React from 'react';
import { cn } from '@/shared/lib/utils';

export interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  containerClassName?: string;
}

export function SearchInput({
  containerClassName,
  className,
  autoComplete = 'off',
  ...props
}: SearchInputProps) {
  return (
    <span
      className={cn(
        'relative inline-flex min-w-[240px] flex-1 basis-[280px] items-center',
        containerClassName,
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
        autoComplete={autoComplete}
        className={cn(
          'box-border w-full rounded-[10px] border border-[#D9E1DD] bg-white',
          'py-[11px] pr-3.5 pl-9 text-[13.5px] text-[#16261F]',
          'placeholder:text-[#98A29D] focus:border-[#C9A227] focus:outline-none',
          className,
        )}
        {...props}
      />
    </span>
  );
}
