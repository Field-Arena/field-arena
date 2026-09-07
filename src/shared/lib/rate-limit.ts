import 'server-only';
import { headers } from 'next/headers';

/* Fixed-window counter, ported from the legacy api/_lib rateLimit() with the
 * same semantics: the window starts on the first request in it and resets
 * wholesale once it lapses, rather than sliding.
 *
 * In-memory and therefore per-instance, exactly as the legacy one was. That
 * makes it a deterrent against scripted submissions, not a distributed quota —
 * good enough for the job it does here (keeping an organizer's review queue
 * from being flooded through the one public write) and honest about its
 * limits. */
interface Bucket {
  windowStart: number;
  count: number;
}

const buckets = new Map<string, Bucket>();

/* Without this the map grows one entry per distinct IP+show forever. */
const MAX_BUCKETS = 10_000;

export interface RateLimitResult {
  limited: boolean;
  retryAfterMs: number;
}

export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now - bucket.windowStart > windowMs) {
    if (buckets.size >= MAX_BUCKETS) {
      for (const [k, b] of buckets) {
        if (now - b.windowStart > windowMs) buckets.delete(k);
      }
      if (buckets.size >= MAX_BUCKETS) buckets.clear();
    }
    buckets.set(key, { windowStart: now, count: 1 });
    return { limited: false, retryAfterMs: 0 };
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    return { limited: true, retryAfterMs: Math.max(windowMs - (now - bucket.windowStart), 0) };
  }
  return { limited: false, retryAfterMs: 0 };
}

/* The FIRST x-forwarded-for entry is whatever the original request claimed, so
 * an attacker can rotate it per request and reset their own bucket. The legacy
 * helper hit exactly that bug and fixed it by preferring the platform's own
 * un-spoofable header and otherwise taking the LAST entry — the hop the proxy
 * itself appended. Same rule here. */
export async function clientIp(): Promise<string> {
  const h = await headers();

  const vercelIp = h.get('x-vercel-forwarded-for');
  const vercelFirst = vercelIp?.split(',')[0]?.trim();
  if (vercelFirst) return vercelFirst;

  const forwarded = h.get('x-forwarded-for');
  if (forwarded) {
    const parts = forwarded.split(',').map((s) => s.trim());
    const last = parts.at(-1);
    if (last) return last;
  }

  return h.get('x-real-ip') ?? 'unknown';
}
