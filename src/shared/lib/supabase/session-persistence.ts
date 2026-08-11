import type { CookieOptions } from '@supabase/ssr';

/**
 * "Keep me signed in on this device" — the sign-in design's checkbox.
 *
 * Supabase writes its auth cookies with a fixed max-age, so honouring an unticked
 * box means stripping that max-age so the cookie dies with the browser session.
 * Doing it once at sign-in is not enough: the proxy refreshes the session on
 * every navigation and re-sets the same cookies, which would silently re-persist
 * a session the user asked not to keep. So the choice is itself recorded in a
 * cookie that both the sign-in action and the proxy read.
 *
 * The flag is stored only for the negative case, and stored as a session cookie
 * too — "do not keep me signed in" that outlives the browser would be its own
 * contradiction. Absent flag therefore means the default: persist.
 */
export const SESSION_PERSISTENCE_COOKIE = 'fa-no-persist';

/** The only value the flag ever holds; its presence is what carries the meaning. */
export const SESSION_PERSISTENCE_OFF = '1';

/**
 * The same options minus anything that would outlive the browser session.
 *
 * `expires` and `maxAge` are both dropped because Supabase sets one or the other
 * depending on version, and leaving either behind keeps the cookie on disk.
 */
export function withoutPersistence(options: CookieOptions): CookieOptions {
  const rest = { ...options };
  delete rest.maxAge;
  delete rest.expires;
  return rest;
}

/** Whether a request's cookies say this session should not be persisted. */
export function persistenceDisabled(value: string | undefined): boolean {
  return value === SESSION_PERSISTENCE_OFF;
}

/**
 * Harden the Supabase auth cookies so the raw JWT + refresh token can never be
 * read by page JavaScript (`document.cookie`).
 *
 * `@supabase/ssr` writes the session into cookies, and by default those come
 * back readable — a single XSS anywhere would then hand an attacker the refresh
 * token and, with it, the account. Every write of these cookies is server-side
 * in this app (sign-in / sign-up / OTP are Server Actions, refresh is the proxy;
 * the browser client only ever calls `uploadToSignedUrl`, which authorises with
 * its own token and needs no session), so forcing HttpOnly here breaks nothing
 * client-side while closing that hole.
 *
 * `secure` is production-only: a Secure cookie is refused over plain http, which
 * is exactly local dev, so requiring it there would lock sign-in out of
 * localhost. Production is always https, where it's on.
 */
export function hardenAuthCookie(options: CookieOptions): CookieOptions {
  return {
    ...options,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: options.sameSite ?? 'lax',
  };
}
