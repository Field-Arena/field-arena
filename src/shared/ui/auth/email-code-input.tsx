'use client';

import { useRef, type ClipboardEvent, type KeyboardEvent } from 'react';
import { EMAIL_CODE_LENGTH } from '@/shared/constants/auth-code';

/**
 * The six single-character boxes for the emailed confirmation code.
 *
 * Three behaviours are what make this usable rather than infuriating, and all
 * three are easy to omit:
 *
 *  - Pasting the whole code into any box fills the rest. People paste codes from
 *    their mail client; without this, only the first digit lands.
 *  - Backspace in an empty box clears and focuses the previous one, so holding
 *    it deletes the code rather than stalling on the first empty box.
 *  - Arrow keys move between boxes.
 *
 * The value is held by the parent as one string, so the form validates a single
 * field rather than six.
 */
export function EmailCodeInput({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
}) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(EMAIL_CODE_LENGTH, ' ').slice(0, EMAIL_CODE_LENGTH).split('');

  function write(next: string) {
    onChange(next.replace(/\D/g, '').slice(0, EMAIL_CODE_LENGTH));
  }

  function focusAt(index: number) {
    inputs.current[Math.min(Math.max(index, 0), EMAIL_CODE_LENGTH - 1)]?.focus();
  }

  function setDigit(index: number, raw: string) {
    const typed = raw.replace(/\D/g, '');
    if (!typed) return;

    const chars = digits.map((d) => (d === ' ' ? '' : d));
    // More than one character means a paste — spread it across the remaining
    // boxes instead of dropping everything after the first.
    typed.split('').forEach((digit, offset) => {
      if (index + offset < EMAIL_CODE_LENGTH) chars[index + offset] = digit;
    });

    write(chars.join(''));
    focusAt(index + typed.length);
  }

  function onKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace') {
      const chars = digits.map((d) => (d === ' ' ? '' : d));
      if (!chars[index] && index > 0) {
        event.preventDefault();
        chars[index - 1] = '';
        write(chars.join(''));
        focusAt(index - 1);
      }
      return;
    }
    if (event.key === 'ArrowLeft') focusAt(index - 1);
    if (event.key === 'ArrowRight') focusAt(index + 1);
  }

  function onPaste(index: number, event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    setDigit(index, event.clipboardData.getData('text'));
  }

  return (
    <div className="flex gap-2.5">
      {digits.map((digit, index) => (
        <input
          // Index is the identity here — these are fixed positions, not a list.
          key={index}
          ref={(element) => {
            inputs.current[index] = element;
          }}
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          disabled={disabled}
          value={digit.trim()}
          onChange={(event) => {
            setDigit(index, event.target.value);
          }}
          onKeyDown={(event) => {
            onKeyDown(index, event);
          }}
          onPaste={(event) => {
            onPaste(index, event);
          }}
          aria-label={`Digit ${String(index + 1)}`}
          className="h-[62px] w-full rounded-[10px] border border-field bg-white text-center font-[family-name:var(--font-nr)] text-[28px] font-medium text-forest outline-none transition-shadow focus:border-gold focus:shadow-[0_0_0_3px_rgba(201,162,39,.16)] disabled:opacity-60"
        />
      ))}
    </div>
  );
}
