/* Payout weeks run Monday 00:00 to the next Monday 00:00 in one business time
 * zone. Everything here returns real instants (Dates), so the statement math
 * can compare them directly against event timestamps. */

function zoneParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
    weekday: 'short',
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return {
    year: Number(get('year')),
    month: Number(get('month')),
    day: Number(get('day')),
    hour: Number(get('hour')),
    minute: Number(get('minute')),
    second: Number(get('second')),
    weekday: get('weekday'),
  };
}

/* The instant that is 00:00 on the given calendar date in the zone. */
function zonedMidnight(year: number, month: number, day: number, timeZone: string): Date {
  const guess = Date.UTC(year, month - 1, day);
  const p = zoneParts(new Date(guess), timeZone);
  const asIfUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  const midnight = new Date(guess - (asIfUtc - guess));
  // Daylight-saving edges: settle on the instant whose local time is 00:00.
  const check = zoneParts(midnight, timeZone);
  if (check.day !== day)
    return new Date(midnight.getTime() + (check.hour >= 12 ? 3_600_000 : -3_600_000));
  return midnight;
}

const WEEKDAY_INDEX: Record<string, number> = {
  Mon: 0,
  Tue: 1,
  Wed: 2,
  Thu: 3,
  Fri: 4,
  Sat: 5,
  Sun: 6,
};

/* The Monday-to-Monday week containing `date`. */
export function payoutWeekContaining(date: Date, timeZone: string): { start: Date; end: Date } {
  const p = zoneParts(date, timeZone);
  const sinceMonday = WEEKDAY_INDEX[p.weekday] ?? 0;
  const monday = new Date(Date.UTC(p.year, p.month - 1, p.day - sinceMonday));
  const nextMonday = new Date(monday.getTime() + 7 * 86_400_000);
  return {
    start: zonedMidnight(
      monday.getUTCFullYear(),
      monday.getUTCMonth() + 1,
      monday.getUTCDate(),
      timeZone,
    ),
    end: zonedMidnight(
      nextMonday.getUTCFullYear(),
      nextMonday.getUTCMonth() + 1,
      nextMonday.getUTCDate(),
      timeZone,
    ),
  };
}

/* The most recent complete week (the one a Monday-morning statement covers). */
export function lastCompletePayoutWeek(now: Date, timeZone: string): { start: Date; end: Date } {
  const thisWeek = payoutWeekContaining(now, timeZone);
  return payoutWeekContaining(new Date(thisWeek.start.getTime() - 3_600_000), timeZone);
}
