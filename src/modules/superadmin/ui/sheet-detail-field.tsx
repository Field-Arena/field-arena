'use client';

import { Input } from '@/shared/ui/shadcn/input';
import { Label } from '@/shared/ui/shadcn/label';
import { LABEL, INPUT } from '@/modules/superadmin/ui/sheet-detail-styles';

export function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const id = `sd-${label.toLowerCase().replace(/[^a-z]+/g, '-')}`;
  return (
    <div>
      <Label htmlFor={id} className={LABEL}>
        {label}
      </Label>
      <Input
        id={id}
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
