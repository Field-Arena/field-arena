import type { CookieOptions } from '@supabase/ssr';

export const SESSION_PERSISTENCE_COOKIE = 'fa-no-persist';

export const SESSION_PERSISTENCE_OFF = '1';

export function withoutPersistence(options: CookieOptions): CookieOptions {
  const rest = { ...options };
  delete rest.maxAge;
  delete rest.expires;
  return rest;
}

export function persistenceDisabled(value: string | undefined): boolean {
  return value === SESSION_PERSISTENCE_OFF;
}

export function hardenAuthCookie(options: CookieOptions): CookieOptions {
  return {
    ...options,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: options.sameSite ?? 'lax',
  };
}
