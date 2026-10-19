/**
 * Returns `value` only when it is a same-origin path on this site, otherwise
 * `fallback`. Every redirect target that comes from a query string, a form
 * field, a cookie or user metadata goes through this — `/\evil.com`,
 * `//evil.com`, `https://evil.com` and paths with control characters all
 * resolve off-site in some browser, so they are rejected here.
 */
export function safeInternalPath(value: string | null | undefined, fallback: string): string;
export function safeInternalPath(
  value: string | null | undefined,
  fallback?: undefined,
): string | undefined;
export function safeInternalPath(
  value: string | null | undefined,
  fallback?: string,
): string | undefined {
  if (!value) return fallback;
  if (!value.startsWith('/') || value.startsWith('//')) return fallback;
  if (value.includes('\\')) return fallback;
  if (/[\u0000-\u001f\u007f]/.test(value)) return fallback;

  try {
    const url = new URL(value, 'http://x');
    if (url.origin !== 'http://x') return fallback;
  } catch {
    return fallback;
  }
  return value;
}
