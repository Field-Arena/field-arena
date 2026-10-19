/** Today's calendar date (YYYY-MM-DD) in the given IANA time zone — the date
 * a signature is dated with. Falls back to UTC when the zone is missing or
 * not one the runtime recognises. */
export function todayInTimeZone(timeZone: string | null | undefined, now = new Date()): string {
  try {
    if (timeZone) {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(now);
    }
  } catch {
    // Unknown zone — fall through to UTC.
  }
  return now.toISOString().slice(0, 10);
}
