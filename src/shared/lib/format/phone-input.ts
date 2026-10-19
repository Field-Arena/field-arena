/**
 * Typing-time guard for phone fields. The schema check
 * ({@link import('@/shared/schemas/phone').isValidPhoneValue}) still runs on
 * submit and on the server; this only stops junk getting into the box in the
 * first place, so "12345678w" can never be typed or pasted.
 */

/** Longest phone value any form accepts (international + extension). */
export const PHONE_INPUT_MAX_LENGTH = 25;

const DISALLOWED_PHONE_CHARS = /[^0-9+()\-.\s]/g;

/** Strips everything but digits and `+ ( ) - .` / spaces, and caps the length. */
export function sanitizePhoneInput(value: string, maxLength = PHONE_INPUT_MAX_LENGTH): string {
  return value.replace(DISALLOWED_PHONE_CHARS, '').slice(0, maxLength);
}

/** Native attributes every phone `<input>` gets: phone keypad, autofill, cap. */
export const PHONE_INPUT_PROPS = {
  type: 'tel',
  inputMode: 'tel',
  autoComplete: 'tel',
  maxLength: PHONE_INPUT_MAX_LENGTH,
} as const;
