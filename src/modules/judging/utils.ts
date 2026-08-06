import { isPast } from '@/shared/lib/format/date';
import type { AssignmentRow, PanelContact, TodayPanelContact } from './data/queries';
import { DEMO_PANEL_CONTACTS, DEMO_TODAY_ASSIGNMENTS, DEMO_UPCOMING_ASSIGNMENTS } from './constants';

/**
 * Which of the "My Assignments" tab's two groups, or History, a class falls
 * into. Published results always mean History even if the date is today or
 * later (a same-day reschedule with results already in); otherwise it's a
 * date compare against the viewer's own day, same convention as `isPast`.
 */
export function classifyAssignment(
  assignment: Pick<AssignmentRow, 'classDate' | 'resultsPublished'>,
  todayIso: string
): 'today' | 'upcoming' | 'history' {
  if (assignment.resultsPublished) return 'history';
  if (assignment.classDate && isPast(assignment.classDate)) return 'history';
  if (assignment.classDate === todayIso) return 'today';
  return 'upcoming';
}

/**
 * Today's ring name(s) and who else is on today's panel — what the shared
 * status card needs on every tab. Not a "vs. schedule" delta; see
 * ui/judging-status-card.tsx for why that part of the design was dropped.
 * Pure so callers fetch `listMyAssignments`/`listPanelContacts` once and
 * reuse them for a page's own content too, rather than fetching twice.
 */
export function buildTodaySnapshot(
  assignments: AssignmentRow[],
  panelContacts: PanelContact[],
  todayIso: string
): { rings: string[]; contacts: TodayPanelContact[] } {
  const todayClassIds = new Set(
    assignments.filter((a) => a.classDate === todayIso).map((a) => a.classId)
  );

  const rings = [
    ...new Set(
      assignments
        .filter((a) => todayClassIds.has(a.classId))
        .map((a) => a.ring)
        .filter((ring): ring is string => ring !== null)
    ),
  ];

  const seen = new Set<string>();
  const contacts: TodayPanelContact[] = [];
  for (const contact of panelContacts) {
    if (!contact.classIds.some((id) => todayClassIds.has(id))) continue;
    if (seen.has(contact.staffId)) continue;
    seen.add(contact.staffId);
    contacts.push({ name: contact.name, role: contact.role, position: contact.position });
  }

  return { rings, contacts };
}

/**
 * Turns the static DEMO_* constants into real AssignmentRow/PanelContact
 * shapes, for a SuperAdmin previewing this workspace (see
 * DEMO_JUDGE_NAME's doc comment in constants.ts for why this exists at all).
 * classDate is the only field that can't be a static constant — "today"
 * moves — so it's filled in here rather than baked into the constant.
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
    id: string
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

export function buildDemoPanelContacts(): PanelContact[] {
  return DEMO_PANEL_CONTACTS.map((c) => ({ ...c, classIds: [...c.classIds] }));
}

/** A class is "complete" once every entry has been scored, scratched, or disqualified — drives the Results view. */
export function isAssignmentComplete(assignment: Pick<AssignmentRow, 'entryCount' | 'advancedCount'>): boolean {
  return assignment.entryCount > 0 && assignment.advancedCount === assignment.entryCount;
}

export interface PlacingRow {
  entryId: string;
  num: string;
  rider: string;
  horse: string;
  pct: number;
  rank: number;
}

/**
 * Ranks already-final entries by percentage (collective total as tie-break),
 * ties sharing a place with the next distinct place skipped. A small
 * duplicate of `modules/scoring/scoring-engine.ts`'s `standings()` — modules
 * don't reach into each other's internals in this codebase, so the same
 * small pure ranking gets its own copy here rather than a cross-module
 * import (same precedent as `resolveScoringPermissions`'s three copies).
 */
export function rankPlacings(
  rides: { entryId: string; num: string; rider: string; horse: string; finalPct: number | null; ctot: number | null }[]
): PlacingRow[] {
  const scored = rides
    .filter((r): r is typeof r & { finalPct: number } => typeof r.finalPct === 'number')
    .sort((a, b) => {
      if (b.finalPct !== a.finalPct) return b.finalPct - a.finalPct;
      if (a.ctot != null && b.ctot != null && a.ctot !== b.ctot) return b.ctot - a.ctot;
      return 0;
    });

  let rank = 1;
  return scored.map((row, i) => {
    if (i > 0) {
      const prev = scored[i - 1];
      const stillTied =
        row.finalPct === prev?.finalPct && (row.ctot == null || prev.ctot == null || row.ctot === prev.ctot);
      if (!stillTied) rank = i + 1;
    }
    return { entryId: row.entryId, num: row.num, rider: row.rider, horse: row.horse, pct: row.finalPct, rank };
  });
}

/** 'HH:MM' 24-hour text (this schema's `classes.time` convention) to "8:00 AM". */
export function formatClassTime(time: string | null): string | null {
  if (!time) return null;
  const match = /^(\d{1,2}):(\d{2})/.exec(time);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = match[2] ?? '00';
  if (Number.isNaN(hours) || hours > 23) return null;
  const period = hours >= 12 ? 'PM' : 'AM';
  const h12 = ((hours + 11) % 12) + 1;
  return `${String(h12)}:${minutes} ${period}`;
}
