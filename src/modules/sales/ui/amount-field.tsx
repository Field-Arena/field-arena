'use client';

import { Input } from '@/shared/ui/shadcn/input';
import { Label } from '@/shared/ui/shadcn/label';

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
      <Label
        htmlFor={id}
        className="mb-1.5 block text-[12px] font-bold tracking-[.08em] text-[#6E7C76] uppercase"
      >
        {label}
      </Label>
      <Input
        id={id}
        type="number"
        min={0}
        max={max}
        step="0.01"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        placeholder={placeholder}
        className="h-auto w-full rounded-[10px] border-[#D9E1DD] px-3.5 py-2.5 text-sm outline-none focus-visible:ring-0"
      />
      {error && <p className="mt-1.5 text-[12.5px] text-[#B4432F]">{error}</p>}
    </div>
  );
}
