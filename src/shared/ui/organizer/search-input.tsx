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
        'relative inline-flex min-w-[210px] flex-1 basis-[210px] items-center',
        containerClassName,
      )}
    >
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#8A94A3"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="pointer-events-none absolute left-2.5"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.3-4.3" />
      </svg>
      <input
        autoComplete={autoComplete}
        className={cn(
          'box-border h-[34px] w-full rounded-[9px] border border-[#E7EAEE] bg-white',
          'pr-2.5 pl-8 text-[13px] text-[#101828]',
          'placeholder:text-[#8A94A3] focus:border-[#9FD3BA] focus:shadow-[0_0_0_3px_#EAF5EF] focus:outline-none',
          className,
        )}
        {...props}
      />
    </span>
  );
}
