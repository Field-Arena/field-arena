'use client';

import { useId, type ReactNode } from 'react';
import { CheckIcon } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export function AuthCheckbox({
  checked,
  onChange,
  children,
  id,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  children: ReactNode;
  id?: string;
}) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;

  return (
    <div className="flex items-center gap-2.5">
      <span className="relative grid size-[18px] flex-none place-items-center">
        <input
          id={fieldId}
          type="checkbox"
          checked={checked}
          onChange={(event) => {
            onChange(event.target.checked);
          }}
          className={cn(
            'peer size-[18px] cursor-pointer appearance-none rounded-[5px] border transition-colors',
            checked ? 'border-gold bg-gold' : 'border-field bg-white',
          )}
        />
        <CheckIcon
          aria-hidden
          className={cn(
            'text-forest pointer-events-none absolute size-[11px] [stroke-width:3.4]',
            checked ? 'opacity-100' : 'opacity-0',
          )}
        />
      </span>
      <label htmlFor={fieldId} className="text-fa-muted cursor-pointer text-[13.5px]">
        {children}
      </label>
    </div>
  );
}
