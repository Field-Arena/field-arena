'use client';

import type { FieldError, UseFormRegisterReturn } from 'react-hook-form';
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
}: {
  id: string;
  label: string;
  error?: FieldError;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  registration: UseFormRegisterReturn;
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
