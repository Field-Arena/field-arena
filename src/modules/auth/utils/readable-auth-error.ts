import { RATE_LIMITED_MESSAGE, CODE_EXPIRED_MESSAGE } from '@/modules/auth/constants';

export function readableAuthError(message: string): string {
  if (/rate limit/i.test(message)) {
    return RATE_LIMITED_MESSAGE;
  }
  if (/expired|invalid/i.test(message)) {
    return CODE_EXPIRED_MESSAGE;
  }
  return message;
}
