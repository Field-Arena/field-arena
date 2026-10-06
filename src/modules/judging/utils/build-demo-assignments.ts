import { resolveTimeZone } from '@/shared/lib/format/time-zone';
import type { AssignmentRow } from '@/modules/judging/types';
import { DEMO_TODAY_ASSIGNMENTS, DEMO_UPCOMING_ASSIGNMENTS } from '@/modules/judging/constants';

export function buildDemoAssignments(todayIso: string): AssignmentRow[] {
  const upcoming = new Date(`${todayIso}T00:00:00Z`);
  upcoming.setUTCDate(upcoming.getUTCDate() + 14);
  const upcomingIso = upcoming.toISOString().slice(0, 10);

  const toRow = (
    d: {
      classLabel: string;
      showName: string;
      time: string | null;
      ring: string;
      position: string;
      partnerName: string;
    },
    classDate: string,
    id: string,
  ): AssignmentRow => ({
    classId: `demo-class-${id}`,
    classLabel: d.classLabel,
    showId: `demo-show-${id}`,
    showName: d.showName,
    showDate: null,
    classDate,
    todayIso,
    timeZone: resolveTimeZone(),
    classTime: d.time,
    ring: d.ring,
    seatId: `demo-seat-${id}`,
    position: d.position,
    seatRole: 'judge',
    partnerName: d.partnerName,
    partnerRole: 'scribe',
    entryCount: 0,
    scoringOpen: false,
    resultsPublished: false,
    scoredCount: 0,
    advancedCount: 0,
  });

  return [
    ...DEMO_TODAY_ASSIGNMENTS.map((d, i) => toRow(d, todayIso, `today-${String(i)}`)),
    ...DEMO_UPCOMING_ASSIGNMENTS.map((d, i) => toRow(d, upcomingIso, `upcoming-${String(i)}`)),
  ];
}
