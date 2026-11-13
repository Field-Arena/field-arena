import { sanitizeIntegerInput } from '@/shared/lib/format/number-input';
import { RIDER_FIELD_MAX } from '@/modules/riders/constants';

/** Typing-time guard for USEF / FEI number boxes: digits only, capped length. */
export function sanitizeMembershipNumber(value: string): string {
  return sanitizeIntegerInput(value, { maxDigits: RIDER_FIELD_MAX.membershipNumber });
}
