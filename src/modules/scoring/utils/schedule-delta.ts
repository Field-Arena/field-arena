import { RIDE_MINUTES } from '@/modules/scoring/constants';

export type ScheduleStatus = 'ahead' | 'yellow' | 'pink' | 'red';

/**
 * Minutes actual-vs-scheduled for this ring, ported from legacy's
 * scheduleDeltaMin/scheduleStatus/scheduleStatusLabel — but against the
 * class's real `classes.time` and `scoring_pos` rather than legacy's
 * client-fabricated `classStartedAt` seed. `scheduledTime` is 'HH:MM',
 * interpreted as today in the viewer's local time zone (same simplification
 * legacy's own clock makes — it never accounted for the show's time zone
 * either). Null if the class has no scheduled time to compare against.
 */
export function scheduleDelta(
  scheduledTime: string | null,
  pos: number,
  now: Date
): { deltaMin: number; status: ScheduleStatus; label: string } | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(scheduledTime ?? '');
  if (!match) return null;
  const [, hourStr, minuteStr] = match;

  const classStartedAt = new Date(now);
  classStartedAt.setHours(Number(hourStr), Number(minuteStr), 0, 0);

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
