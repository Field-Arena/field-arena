import type { MemberRow } from '@/modules/organizations/data/queries';
import { MEMBER_CSV_HEADERS } from '@/modules/organizations/constants';

/** CSV field escaping — wraps in quotes (doubling any inner quote) only when the field needs it. */
function escapeMemberCsvField(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/**
 * Builds the "Export List" CSV for the Member Database — one row per member,
 * plus one column per custom field any imported row carries. A person
 * imported without split names still exports as two columns: the display
 * name is the only thing that survived, so it leads.
 */
export function buildMembersCsv(members: MemberRow[]): string {
  const extraKeys = [...new Set(members.flatMap((m) => Object.keys(m.extraFields)))].sort();
  const headers = [...MEMBER_CSV_HEADERS, ...extraKeys];
  const lines = [headers.map(escapeMemberCsvField).join(',')];

  for (const m of members) {
    // A person imported without split names still exports as two columns —
    // the display name is the only thing that survived, so it leads.
    const first = m.firstName ?? m.name.split(/\s+/).slice(0, -1).join(' ');
    const last = m.lastName ?? m.name.split(/\s+/).slice(-1).join(' ');
    lines.push(
      [
        first,
        last,
        m.role ?? '',
        m.phone ?? '',
        m.email ?? '',
        m.notes ?? '',
        ...extraKeys.map((k) => m.extraFields[k] ?? ''),
      ]
        .map(escapeMemberCsvField)
        .join(','),
    );
  }

  return lines.join('\n');
}
