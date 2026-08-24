'use client';

import { useId, useState } from 'react';
import { EyeIcon, EyeOffIcon } from 'lucide-react';
import { Input } from '@/shared/ui/shadcn/input';
import { Label } from '@/shared/ui/shadcn/label';
import { cn } from '@/shared/lib/utils';
import { FIELD_CLASSES, LABEL_CLASSES, type AuthFieldProps } from '@/shared/ui/auth/auth-field';

export function AuthPasswordField({
  label,
  error,
  action,
  className,
  id,
  ...props
}: AuthFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const errorId = `${fieldId}-error`;
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <div className="mb-[9px] flex items-baseline justify-between gap-4">
        <Label htmlFor={fieldId} className={LABEL_CLASSES}>
          {label}
        </Label>
        {action}
      </div>
      <div className="relative">
        <Input
          id={fieldId}
          type={visible ? 'text' : 'password'}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(FIELD_CLASSES, 'pr-12', className)}
          {...props}
        />
        <button
          type="button"
          onClick={() => {
            setVisible((current) => !current);
          }}
          aria-label={visible ? 'Hide password' : 'Show password'}
          className="text-fa-muted-2 hover:bg-mint hover:text-forest absolute inset-y-[6px] right-[6px] grid w-[38px] place-items-center rounded-lg transition-colors"
        >
          {visible ? (
            <EyeOffIcon className="size-[17px]" aria-hidden />
          ) : (
            <EyeIcon className="size-[17px]" aria-hidden />
          )}
        </button>
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-alert-fg mt-2 text-[13px]">
          {error}
        </p>
      )}
    </div>
  );
}
