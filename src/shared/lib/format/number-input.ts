import type { KeyboardEvent } from 'react';

/**
 * Typing-time guards for numeric fields (money, counts, minutes, scores).
 *
 * One approach app-wide:
 *  - text inputs (`type="text"` + `inputMode`) run their value through
 *    {@link sanitizeIntegerInput} / {@link sanitizeDecimalInput} in `onChange`
 *    (this also cleans pasted text);
 *  - `type="number"` inputs keep their spinner/`valueAsNumber` behaviour and add
 *    `onKeyDown={blockNonIntegerKeys}` / `blockNonDecimalKeys`, because the
 *    browser still lets `e`, `E`, `+` and `-` through on its own.
 * The zod schema stays the real check, on the client and in the server action.
 */

interface IntegerOptions {
  /** Max digits kept (default 9 — well past any count the app stores). */
  maxDigits?: number;
  /** Keep a single leading minus sign. */
  allowNegative?: boolean;
}

/** Digits only (optionally one leading `-`), capped at `maxDigits`. */
export function sanitizeIntegerInput(value: string, options: IntegerOptions = {}): string {
  const { maxDigits = 9, allowNegative = false } = options;
  const negative = allowNegative && value.trimStart().startsWith('-');
  const digits = value.replace(/\D/g, '').slice(0, maxDigits);
  return negative ? `-${digits}` : digits;
}

interface DecimalOptions {
  /** Digits allowed after the point (default 2 — money). */
  decimals?: number;
  /** Digits allowed before the point (default 9). */
  maxIntegerDigits?: number;
  /** Keep a single leading minus sign. */
  allowNegative?: boolean;
}

/**
 * Digits with at most one `.`, capped at `decimals` fraction digits and
 * `maxIntegerDigits` whole digits. A trailing `.` is kept so "12." can be typed
 * on the way to "12.50". Commas are dropped ("1,250" → "1250").
 */
export function sanitizeDecimalInput(value: string, options: DecimalOptions = {}): string {
  const { decimals = 2, maxIntegerDigits = 9, allowNegative = false } = options;
  const negative = allowNegative && value.trimStart().startsWith('-');
  const cleaned = value.replace(/[^0-9.]/g, '');
  const dot = cleaned.indexOf('.');
  let result: string;
  if (dot === -1 || decimals === 0) {
    result = cleaned.replace(/\./g, '').slice(0, maxIntegerDigits);
  } else {
    const whole = cleaned.slice(0, dot).slice(0, maxIntegerDigits);
    const fraction = cleaned
      .slice(dot + 1)
      .replace(/\./g, '')
      .slice(0, decimals);
    result = `${whole}.${fraction}`;
  }
  return negative ? `-${result}` : result;
}

const ALWAYS_BLOCKED = new Set(['e', 'E', '+']);

/**
 * `onKeyDown` for `type="number"` inputs holding whole, non-negative numbers:
 * blocks `e`, `E`, `+`, `-` and `.`.
 */
export function blockNonIntegerKeys(event: KeyboardEvent<HTMLInputElement>): void {
  if (ALWAYS_BLOCKED.has(event.key) || event.key === '-' || event.key === '.') {
    event.preventDefault();
  }
}

/**
 * `onKeyDown` for `type="number"` inputs holding non-negative decimals (money):
 * blocks `e`, `E`, `+` and `-`.
 */
export function blockNonDecimalKeys(event: KeyboardEvent<HTMLInputElement>): void {
  if (ALWAYS_BLOCKED.has(event.key) || event.key === '-') event.preventDefault();
}

/** `onKeyDown` for `type="number"` inputs that may go negative: blocks `e`, `E`, `+`. */
export function blockExponentKeys(event: KeyboardEvent<HTMLInputElement>): void {
  if (ALWAYS_BLOCKED.has(event.key)) event.preventDefault();
}
