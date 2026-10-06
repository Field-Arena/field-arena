/**
 * Maps a raw Supabase auth error message to a short code the login page knows
 * how to explain. The raw text is never put in the URL — it is attacker-
 * controllable via `?error=` and can leak internals.
 */
export function authErrorCode(message: string | undefined): string {
  if (!message) return 'auth_failed';
  if (/expired|invalid|not found/i.test(message)) return 'link_expired';
  if (/rate limit/i.test(message)) return 'rate_limited';
  return 'auth_failed';
}
