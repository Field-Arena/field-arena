const PHONE_PATTERN = /^[0-9+()\-.\s]+$/;
const MIN_PHONE_DIGITS = 7;

/**
 * True for a blank value (nothing to validate) or a string that looks like a
 * phone number — digits with the common separators (a leading +, spaces,
 * dashes, dots, parentheses). False for anything with letters in it, so a
 * stray name or note typed into a phone field fails validation instead of
 * silently saving as the phone number.
 *
 * Used as a `.refine()` predicate, chained onto each call site's own
 * existing schema (its own `.max()` / `.optional()` / `.default()` /
 * `.nullish()` shape stays exactly as it was) rather than replacing those
 * schemas outright — this is format validation layered on top, not a new
 * required/optional policy.
 */
export function isValidPhoneValue(value: string | null | undefined): boolean {
  if (value == null) return true;
  const trimmed = value.trim();
  if (trimmed === '') return true;
  return PHONE_PATTERN.test(trimmed) && trimmed.replace(/\D/g, '').length >= MIN_PHONE_DIGITS;
}

export const PHONE_INVALID_MESSAGE = 'Enter a valid phone number';
