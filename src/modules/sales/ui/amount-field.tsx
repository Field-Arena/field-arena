'use client';

import { Input } from '@/shared/ui/shadcn/input';
import { blockNonDecimalKeys, sanitizeDecimalInput } from '@/shared/lib/format/number-input';

export function AmountField({
  id,
  label,
  value,
  onChange,
  max,
  placeholder,
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  max?: number;
  placeholder?: string;
  error?: string;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-[12px] font-bold tracking-[.08em] text-[#8A94A3] uppercase"
      >
        {label}
      </label>
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        min={0}
        max={max}
        step="0.01"
        value={value}
        onKeyDown={blockNonDecimalKeys}
        onChange={(e) => {
          onChange(sanitizeDecimalInput(e.target.value, { decimals: 2, maxIntegerDigits: 7 }));
        }}
        aria-invalid={error ? true : undefined}
        placeholder={placeholder}
        className="h-auto w-full rounded-[10px] border-[#E7EAEE] px-3.5 py-2.5 text-sm outline-none focus-visible:ring-0"
      />
      {error && <p className="mt-1.5 text-[12.5px] text-[#B42318]">{error}</p>}
    </div>
  );
}
