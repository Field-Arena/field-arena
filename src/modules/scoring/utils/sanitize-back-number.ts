import { BACK_NUMBER_MAX_LENGTH } from '@/modules/scoring/constants';

/** Typing-time guard for a back (rider) number: letters, digits and `-`, capped. */
export function sanitizeBackNumber(value: string): string {
  return value.replace(/[^A-Za-z0-9-]/g, '').slice(0, BACK_NUMBER_MAX_LENGTH);
}
