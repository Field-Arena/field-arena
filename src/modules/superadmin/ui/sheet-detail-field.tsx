'use client';

import type { ComponentProps } from 'react';
import { Input } from '@/shared/ui/shadcn/input';
import { LABEL, INPUT } from '@/modules/superadmin/ui/sheet-detail-styles';

export function Field({
  label,
  value,
  onChange,
  placeholder,
  inputProps,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  /** Extra native attributes (inputMode, maxLength, …). */
  inputProps?: Omit<ComponentProps<'input'>, 'id' | 'value' | 'onChange'>;
}) {
  const id = `sd-${label.toLowerCase().replace(/[^a-z]+/g, '-')}`;
  return (
    <div>
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      <Input
        id={id}
        {...inputProps}
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        className={`h-auto ${INPUT}`}
      />
    </div>
  );
}
