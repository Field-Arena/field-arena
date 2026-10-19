'use client';

import type { ComponentProps } from 'react';
import { Input } from '@/shared/ui/shadcn/input';
import { LABEL, INPUT } from '@/modules/superadmin/ui/lead-detail-styles';

export function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  error,
  inputProps,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  /** Inline validation message shown under the input. */
  error?: string;
  /** Extra native attributes (inputMode, maxLength, …). */
  inputProps?: Omit<ComponentProps<'input'>, 'id' | 'value' | 'onChange'>;
}) {
  const id = `ld-${label.toLowerCase().replace(/[^a-z]+/g, '-')}`;
  const errorId = `${id}-error`;
  return (
    <div>
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      <Input
        id={id}
        type={type}
        {...inputProps}
        value={value}
        placeholder={placeholder}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        className={`h-auto ${INPUT}`}
      />
      {error && (
        <p id={errorId} role="alert" className="text-status-danger mt-1.5 text-[12.5px]">
          {error}
        </p>
      )}
    </div>
  );
}
