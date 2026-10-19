import { resolveTimeZone } from '@/shared/lib/format/time-zone';
import { isAssignmentComplete } from './is-assignment-complete';
import type { AssignmentRow, PanelContact, TodayPanelContact } from '@/modules/judging/types';

export interface RingSummary {
  ring: string;
  classes: number;
  firstTime: string | null;
  /** The class running (or next to run) in this ring: its scheduled start and
   * how many rides are done — what the live pace is measured from. Null when
   * every class you sit on there is finished. */
  active: { time: string | null; pos: number } | null;
  /** The show's timezone — class times are wall-clock there. */
  timeZone: string;
}

export function buildTodaySnapshot(
  assignments: AssignmentRow[],
  panelContacts: PanelContact[],
): {
  rings: string[];
  ringSummaries: RingSummary[];
  contacts: TodayPanelContact[];
  assignmentsToday: number;
} {
  const todayClassIds = new Set(
    assignments.filter((a) => a.classDate === a.todayIso).map((a) => a.classId),
  );

  const rings = [
    ...new Set(
      assignments
        .filter((a) => todayClassIds.has(a.classId))
        .map((a) => a.ring)
        .filter((ring): ring is string => ring !== null),
    ),
  ];

  // One line per ring for the clock strip: how many of today's classes you sit
  // on there, and when the first one starts ("HH:MM" sorts as text).
  const byRing = new Map<string, AssignmentRow[]>();
  for (const a of assignments) {
    if (!todayClassIds.has(a.classId)) continue;
    // No ring yet means the show office hasn't put the class in a ring.
    const ring = a.ring ?? 'Ring not assigned yet';
    byRing.set(ring, [...(byRing.get(ring) ?? []), a]);
  }
  const ringSummaries: RingSummary[] = [...byRing.entries()].map(([ring, rows]) => {
    const classes = [...new Map(rows.map((r) => [r.classId, r])).values()].sort((a, b) =>
      (a.classTime ?? '').localeCompare(b.classTime ?? ''),
    );
    const unfinished = classes.filter((c) => !isAssignmentComplete(c));
    const active = unfinished.find((c) => c.scoringOpen) ?? unfinished[0] ?? null;
    return {
      ring,
      classes: classes.length,
      firstTime: classes[0]?.classTime ?? null,
      active: active ? { time: active.classTime, pos: active.advancedCount } : null,
      timeZone: (active ?? classes[0])?.timeZone ?? rows[0]?.timeZone ?? resolveTimeZone(),
    };
  });

  const seen = new Set<string>();
  const contacts: TodayPanelContact[] = [];
  for (const contact of panelContacts) {
    if (!contact.classIds.some((id) => todayClassIds.has(id))) continue;
    if (seen.has(contact.staffId)) continue;
    seen.add(contact.staffId);
    contacts.push({ name: contact.name, role: contact.role, position: contact.position });
  }

  return { rings, ringSummaries, contacts, assignmentsToday: todayClassIds.size };
}
