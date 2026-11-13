/**
 * Membership / registration numbers (USEF, USDF, FEI, breed registries):
 * letters, digits, spaces and the separators `-`, `.` and `/` only.
 */
export const MEMBERSHIP_NUMBER_PATTERN = /^[A-Za-z0-9 ./-]*$/;

export const MEMBERSHIP_NUMBER_INVALID_MESSAGE = 'Use letters, numbers, spaces, - . or / only';

/** Typing-time guard: strips any other character and caps the length. */
export function sanitizeMembershipNumber(value: string, maxLength = 60): string {
  return value.replace(/[^A-Za-z0-9 ./-]/g, '').slice(0, maxLength);
}
