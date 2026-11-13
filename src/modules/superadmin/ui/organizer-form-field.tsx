'use client';

import type { ComponentProps } from 'react';
import type { FieldError } from 'react-hook-form';
import { Input } from '@/shared/ui/shadcn/input';
import { Label } from '@/shared/ui/shadcn/label';

export function FormField({
  id,
  label,
  error,
  type = 'text',
  placeholder,
  autoComplete,
  registration,
  inputProps,
}: {
  id: string;
  label: string;
  error?: FieldError;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  registration: Record<string, unknown>;
  /** Extra native attributes (inputMode, maxLength, …) for the input. */
  inputProps?: Omit<ComponentProps<'input'>, 'id' | 'name' | 'onChange' | 'onBlur' | 'ref'>;
}) {
  const errorId = `${id}-error`;

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        {...inputProps}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        {...registration}
      />
      {error && (
        <p id={errorId} role="alert" className="text-status-danger text-[13px]">
          {error.message}
        </p>
      )}
    </div>
  );
}
