import type { AssignmentRow } from '@/modules/judging/data/queries';
import { DEMO_TODAY_ASSIGNMENTS, DEMO_UPCOMING_ASSIGNMENTS } from '@/modules/judging/constants';

/**
 * Turns the static DEMO_* constants into real AssignmentRow shapes, for a
 * SuperAdmin previewing this workspace (see DEMO_JUDGE_NAME's doc comment in
 * constants.ts for why this exists at all). classDate is the only field that
 * can't be a static constant — "today" moves — so it's filled in here rather
 * than baked into the constant.
 */
export function buildDemoAssignments(todayIso: string): AssignmentRow[] {
  const upcoming = new Date(`${todayIso}T00:00:00`);
  upcoming.setDate(upcoming.getDate() + 14);
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
