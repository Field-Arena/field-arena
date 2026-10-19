import { RIDE_MINUTES } from '@/shared/constants/ride-pace';
import { todayInZone, zonedDateTimeToUtc } from '@/shared/lib/format/time-zone';

export type ScheduleStatus = 'ahead' | 'yellow' | 'pink' | 'red';

export function scheduleDelta(
  scheduledTime: string | null,
  pos: number,
  now: Date,
  /** The show's IANA zone. classes.time is wall-clock time at the show; without
   * a zone it is read in the runtime's local zone (UTC on the server). */
  timeZone?: string | null,
): { deltaMin: number; status: ScheduleStatus; label: string } | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(scheduledTime ?? '');
  if (!match) return null;
  const [, hourStr, minuteStr] = match;

  let classStartedAt: Date;
  if (timeZone) {
    const zoned = zonedDateTimeToUtc(
      todayInZone(timeZone, now),
      `${hourStr ?? '0'}:${minuteStr ?? '00'}`,
      timeZone,
    );
    if (!zoned) return null;
    classStartedAt = zoned;
  } else {
    classStartedAt = new Date(now);
    classStartedAt.setHours(Number(hourStr), Number(minuteStr), 0, 0);
  }

  const scheduledMin = pos * RIDE_MINUTES;
  const actualMin = (now.getTime() - classStartedAt.getTime()) / 60000;
  const deltaMin = Math.round(actualMin - scheduledMin);

  const status: ScheduleStatus =
    deltaMin < 0 ? 'ahead' : deltaMin <= 1 ? 'yellow' : deltaMin <= 10 ? 'pink' : 'red';
  const label =
    deltaMin < 0
      ? `${String(Math.abs(deltaMin))} min ahead of schedule`
      : deltaMin === 0
        ? 'On schedule'
        : `${String(deltaMin)} min behind schedule`;

  return { deltaMin, status, label };
}
