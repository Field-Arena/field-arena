import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';

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

  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
