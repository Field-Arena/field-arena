'use client';

import { SearchIcon } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export function OpsSearch({
  value,
  onChange,
  placeholder,
  label,
  className,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder: string;
  label: string;
  className?: string;
}) {
  return (
    <label
      className={cn(
        'ml-auto flex h-10 w-[290px] max-w-full items-center gap-2 rounded-[10px] border-2 border-[#C9D3CE] bg-white px-3 focus-within:border-[#1A5B3C]',
        className,
      )}
    >
      <SearchIcon className="size-4 text-[#98A29D]" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        placeholder={placeholder}
        aria-label={label}
        className="w-full border-0 bg-transparent text-[14px] outline-none"
      />
    </label>
  );
}
