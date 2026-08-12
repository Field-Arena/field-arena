import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Verify a Calendly webhook signature (ported from field-and-arena-main
 * api/_lib/calendly.js).
 *
 * Calendly signs each payload with HMAC-SHA256 over "<timestamp>.<raw body>"
 * using the signing key shown when the webhook subscription is created, and
 * sends it as `Calendly-Webhook-Signature: t=<timestamp>,v1=<signature>`.
 * Verification needs the EXACT raw bytes Calendly sent — re-serializing a parsed
 * JSON body can byte-for-byte differ from what was signed — so the caller must
 * pass the untouched request-body string.
 */
export function verifyCalendlySignature(
  rawBody: string,
  signatureHeader: string | null,
  signingKey: string,
): boolean {
  if (!signatureHeader || !signingKey) return false;

  const parts: Record<string, string> = {};
  for (const part of signatureHeader.split(',')) {
    const [key, value] = part.split('=').map((s) => s.trim());
    if (key && value !== undefined) parts[key] = value;
  }
  const t = parts.t;
  const v1 = parts.v1;
  if (!t || !v1) return false;

  const expected = createHmac('sha256', signingKey).update(`${t}.${rawBody}`).digest('hex');
  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(v1, 'hex');
  // A length mismatch is a forged/malformed signature, not a timing concern —
  // timingSafeEqual would throw on unequal lengths, so reject up front.
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
