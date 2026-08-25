import type {
  AssignmentRow,
  PanelContact,
  TodayPanelContact,
} from '@/modules/judging/data/queries';

export function buildTodaySnapshot(
  assignments: AssignmentRow[],
  panelContacts: PanelContact[],
  todayIso: string,
): { rings: string[]; contacts: TodayPanelContact[]; assignmentsToday: number } {
  const todayClassIds = new Set(
    assignments.filter((a) => a.classDate === todayIso).map((a) => a.classId),
  );

  const rings = [
    ...new Set(
      assignments
        .filter((a) => todayClassIds.has(a.classId))
        .map((a) => a.ring)
        .filter((ring): ring is string => ring !== null),
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

  return { rings, contacts, assignmentsToday: todayClassIds.size };
}
