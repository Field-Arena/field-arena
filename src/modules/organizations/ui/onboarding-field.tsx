import type { ReactNode } from 'react';

const LABEL = 'mb-2 block text-xs font-bold uppercase tracking-[.1em] text-forest';

export function OnboardingField({
  id,
  label,
  required,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className={LABEL}>
        {label}
        {required && (
          <span aria-hidden className="text-gold ml-1">
            *
          </span>
        )}
      </label>
      {children}
      {error && (
        <p role="alert" className="text-alert-fg mt-1.5 text-[12.5px]">
          {error}
        </p>
      )}
    </div>
  );
}
