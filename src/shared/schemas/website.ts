import { z } from 'zod';
import { normalizeWebsiteUrl } from '@/shared/lib/format/url-input';

export const WEBSITE_INVALID_MESSAGE = 'Enter a valid website, e.g. example.com';

/**
 * True for a blank value or something that parses as an http(s) URL with a
 * dotted host once `https://` is added when missing — so "example.com" and
 * "https://example.com/path" pass, "not a site" does not.
 */
export function isValidWebsiteValue(value: string | null | undefined): boolean {
  if (value == null) return true;
  const normalized = normalizeWebsiteUrl(value);
  if (normalized === '') return true;
  if (/\s/.test(normalized)) return false;
  try {
    const url = new URL(normalized);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
    const host = url.hostname;
    return /^[a-z\d-]+(\.[a-z\d-]+)*\.[a-z]{2,}$/i.test(host) || host === 'localhost';
  } catch {
    return false;
  }
}

/**
 * Optional website: trimmed, validated, and normalized to carry a scheme
 * ("example.com" → "https://example.com"). Blank becomes `undefined`.
 */
export function optionalWebsiteSchema(max = 200) {
  return z
    .string()
    .trim()
    .max(max)
    .refine(isValidWebsiteValue, WEBSITE_INVALID_MESSAGE)
    .optional()
    .transform((value) => (value ? normalizeWebsiteUrl(value) : undefined));
}
