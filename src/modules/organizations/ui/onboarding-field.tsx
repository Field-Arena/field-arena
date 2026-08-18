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
          <span aria-hidden className="ml-1 text-gold">
            *
          </span>
        )}
      </label>
      {children}
      {error && (
        <p role="alert" className="mt-1.5 text-[12.5px] text-alert-fg">
          {error}
        </p>
      )}
    </div>
  );
}
