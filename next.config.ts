import type { NextConfig } from 'next';

/**
 * Project-wide security response headers (BUG-SEC-002).
 *
 * Deliberately conservative so nothing in the app breaks:
 *  - X-Frame-Options + CSP `frame-ancestors` block clickjacking (same-origin
 *    framing is still allowed, which the marketing live-preview relies on).
 *  - `object-src 'none'` / `base-uri 'self'` are safe CSP directives that do
 *    NOT touch script/style, so no nonce plumbing is needed. A full script-src
 *    CSP is a larger, separate hardening step and is intentionally not forced
 *    here where it would risk breaking Next's inline runtime.
 */
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' },
  {
    key: 'Content-Security-Policy',
    value: "frame-ancestors 'self'; object-src 'none'; base-uri 'self'",
  },
];

const nextConfig: NextConfig = {
  // Do not advertise the framework/version (BUG-SEC-002).
  poweredByHeader: false,
  experimental: {
    // Catalog-document uploads reach the server as base64 in a Server Action
    // body; the default 1 MB cap rejects any real PDF. 8 MB covers a test sheet
    // with room for the ~33% base64 overhead.
    serverActions: { bodySizeLimit: '8mb' },
  },
  headers() {
    return Promise.resolve([{ source: '/:path*', headers: securityHeaders }]);
  },
};

export default nextConfig;
