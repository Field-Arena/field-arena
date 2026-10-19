import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';

/** A signed payload older than this is treated as a replay and rejected. */
const SIGNATURE_TOLERANCE_SECONDS = 5 * 60;

export function verifyCalendlySignature(
  rawBody: string,
  signatureHeader: string | null,
  signingKey: string,
  nowMs: number = Date.now(),
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

  // `t` is the Unix time (seconds) Calendly signed at; it is part of the HMAC
  // input, so it can't be moved without breaking the signature.
  const signedAt = Number(t);
  if (!Number.isFinite(signedAt)) return false;
  if (Math.abs(nowMs / 1000 - signedAt) > SIGNATURE_TOLERANCE_SECONDS) return false;

  const expected = createHmac('sha256', signingKey).update(`${t}.${rawBody}`).digest('hex');
  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(v1, 'hex');

  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
