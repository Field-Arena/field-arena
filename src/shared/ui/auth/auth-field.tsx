'use client';

import { useId, useState, type ComponentProps } from 'react';
import { EyeIcon, EyeOffIcon } from 'lucide-react';
import { Input } from '@/shared/ui/shadcn/input';
import { Label } from '@/shared/ui/shadcn/label';
import { cn } from '@/shared/lib/utils';

const FIELD_CLASSES =
  'h-auto w-full rounded-xl border-field bg-white px-4 py-[15px] text-[15px] text-ink-deep ' +
  'placeholder:text-[#9AA6A0] focus-visible:border-gold focus-visible:ring-[3px] ' +
  'focus-visible:ring-gold/[.16] aria-invalid:border-alert-line';

const LABEL_CLASSES = 'text-xs font-bold uppercase tracking-[.1em] text-forest';

interface AuthFieldProps extends ComponentProps<typeof Input> {
  label: string;
  error?: string;

  action?: React.ReactNode;
}

export function AuthField({ label, error, action, className, id, ...props }: AuthFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const errorId = `${fieldId}-error`;

  return (
    <div>
      <div
        className={cn(
          'flex items-baseline justify-between gap-4',
          action ? 'mb-[9px]' : 'mb-[9px]',
        )}
      >
        <Label htmlFor={fieldId} className={LABEL_CLASSES}>
          {label}
        </Label>
        {action}
      </div>
      <Input
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(FIELD_CLASSES, className)}
        {...props}
      />
      {error && (
        <p id={errorId} role="alert" className="text-alert-fg mt-2 text-[13px]">
          {error}
        </p>
      )}
    </div>
  );
}

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
