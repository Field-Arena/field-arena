'use client';

import type { ComponentProps } from 'react';
import type { FieldError } from 'react-hook-form';
import { Input } from '@/shared/ui/shadcn/input';

const FIELD_LABEL =
  'mb-2 block text-[11px] font-bold uppercase tracking-[.08em] text-[#101828] whitespace-nowrap';
const FIELD_INPUT =
  'w-full rounded-[9px] border border-[#E7EAEE] bg-white px-[14px] py-[13px] text-[14.5px] text-[#101828] ' +
  'placeholder:text-[#8A94A3] focus-visible:border-[#9FD3BA] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#EAF5EF]';

export function Field({
  id,
  label,
  error,
  type = 'text',
  placeholder,
  ...props
}: {
  id: string;
  label: string;
  error?: FieldError;
  type?: string;
  placeholder?: string;
} & ComponentProps<'input'>) {
  const errorId = `${id}-error`;

  return (
    <div>
      <label htmlFor={id} className={FIELD_LABEL}>
        {label}
      </label>
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        className={`h-auto ${FIELD_INPUT}`}
        {...props}
      />
      {error && (
        <p id={errorId} role="alert" className="text-status-danger mt-1.5 text-[13px]">
          {error.message}
        </p>
      )}
    </div>
  );
}
