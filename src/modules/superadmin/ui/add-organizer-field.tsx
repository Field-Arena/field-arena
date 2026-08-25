'use client';

import type { ComponentProps } from 'react';
import type { FieldError } from 'react-hook-form';
import { Input } from '@/shared/ui/shadcn/input';
import { Label } from '@/shared/ui/shadcn/label';

const FIELD_LABEL =
  'mb-2 block text-[11px] font-bold uppercase tracking-[.12em] text-hunter-deep whitespace-nowrap';
const FIELD_INPUT =
  'w-full rounded-[9px] border border-[#D7E0DA] bg-white px-[14px] py-[13px] text-[14.5px] text-[#16261F] ' +
  'placeholder:text-[#98A29D] focus-visible:border-gold focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-gold/[.15]';

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
      <Label htmlFor={id} className={FIELD_LABEL}>
        {label}
      </Label>
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
