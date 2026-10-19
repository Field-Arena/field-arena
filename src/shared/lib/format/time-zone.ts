// Wall-clock <-> instant conversion in a named IANA zone, using Intl only.
// Server code runs in UTC (Vercel), so anything the organizer typed as a local
// date/time ("tickets close 2026-05-01 18:00") must be read in the show's zone,
// not the process zone.

export const DEFAULT_TIME_ZONE = 'America/New_York';

function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** First usable zone from the candidates (show, then org), else the app default. */
export function resolveTimeZone(...candidates: (string | null | undefined)[]): string {
  for (const tz of candidates) {
    const trimmed = tz?.trim();
    if (trimmed && isValidTimeZone(trimmed)) return trimmed;
  }
  return DEFAULT_TIME_ZONE;
}

interface WallParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function formatterFor(tz: string): Intl.DateTimeFormat {
  let fmt = formatterCache.get(tz);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    formatterCache.set(tz, fmt);
  }
  return fmt;
}

function wallPartsInZone(instant: Date, tz: string): WallParts {
  const parts: Record<string, number> = {};
  for (const p of formatterFor(tz).formatToParts(instant)) {
    if (p.type !== 'literal') parts[p.type] = Number(p.value);
  }
  return {
    year: parts.year ?? 0,
    month: parts.month ?? 1,
    day: parts.day ?? 1,
    hour: (parts.hour ?? 0) % 24,
    minute: parts.minute ?? 0,
    second: parts.second ?? 0,
  };
}

// Offset (ms) of `tz` from UTC at the given instant.
function zoneOffsetMs(instant: Date, tz: string): number {
  const w = wallPartsInZone(instant, tz);
  const asUtc = Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute, w.second);
  return asUtc - Math.floor(instant.getTime() / 1000) * 1000;
}

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_RE = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/;

/**
 * The instant at which the wall clock in `tz` reads `dateStr` `timeStr`
 * (YYYY-MM-DD, HH:MM[:SS]; time defaults to 00:00). Null on bad input.
 */
export function zonedDateTimeToUtc(
  dateStr: string,
  timeStr: string | null | undefined,
  tz: string,
): Date | null {
  const d = DATE_RE.exec(dateStr.trim());
  if (!d) return null;
  const t = TIME_RE.exec((timeStr ?? '').trim() || '00:00');
  if (!t) return null;
  const zone = resolveTimeZone(tz);
  const wallAsUtc = Date.UTC(
    Number(d[1]),
    Number(d[2]) - 1,
    Number(d[3]),
    Number(t[1]),
    Number(t[2]),
    Number(t[3] ?? 0),
  );
  if (Number.isNaN(wallAsUtc)) return null;
  // Two passes settle the offset across a DST boundary.
  let guess = wallAsUtc - zoneOffsetMs(new Date(wallAsUtc), zone);
  const second = wallAsUtc - zoneOffsetMs(new Date(guess), zone);
  if (second !== guess) guess = second;
  const result = new Date(guess);
  return Number.isNaN(result.getTime()) ? null : result;
}

/** Today's calendar date (YYYY-MM-DD) as seen in `tz`. */
export function todayInZone(tz: string, now: Date = new Date()): string {
  const w = wallPartsInZone(now, resolveTimeZone(tz));
  return `${String(w.year).padStart(4, '0')}-${String(w.month).padStart(2, '0')}-${String(w.day).padStart(2, '0')}`;
}
