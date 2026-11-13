import type { ChangeEvent } from 'react';

/**
 * Wraps a react-hook-form `register(...)` result so the typed value is cleaned
 * before RHF sees it — e.g. `{...withSanitizer(register('phone'), sanitizePhoneInput)}`.
 * The DOM value is rewritten in place (so the box shows the cleaned text) and
 * then the original `onChange` runs. Pasted text goes through the same path.
 */
export function withSanitizer<
  T extends { onChange: (event: { target: unknown; type?: unknown }) => unknown },
>(registration: T, sanitize: (value: string) => string): T {
  return {
    ...registration,
    onChange: (event: ChangeEvent<HTMLInputElement>) => {
      const input = event.target;
      const next = sanitize(input.value);
      if (next !== input.value) input.value = next;
      return registration.onChange(event);
    },
  };
}
