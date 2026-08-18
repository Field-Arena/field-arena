import type { CreateMemberInput } from '@/modules/organizations/schemas';
import { MEMBER_TYPES } from '@/modules/organizations/constants';
import { parseMemberCsvLine } from '@/modules/organizations/utils/parse-member-csv-line';
import type { ParsedMemberCsvColumn } from '@/modules/organizations/utils/detect-member-csv-columns';

/**
 * Turns parsed CSV rows into members, honouring the field picker's
 * exclusions.
 *
 * Name is always brought in — a record cannot exist without one — so it is
 * never offered as something to exclude.
 */
export function buildMemberRowsFromCsv(
  dataLines: string[],
  columns: ParsedMemberCsvColumn[],
  excluded: Set<string>,
): CreateMemberInput[] {
  const out: CreateMemberInput[] = [];

  for (const line of dataLines) {
    const cells = parseMemberCsvLine(line);
    const record: Partial<Record<keyof CreateMemberInput, string>> = {};
    const extra: Record<string, string> = {};

    for (const col of columns) {
      if (excluded.has(col.header)) continue;
      const value = cells[col.index] ?? '';
      if (col.field) record[col.field] = value;
      else if (col.header && value) extra[col.header] = value;
    }

    const firstName = record.firstName ?? '';
    const lastName = record.lastName ?? '';
    const name = record.name ?? [firstName, lastName].filter(Boolean).join(' ');
    if (!name.trim()) continue;

    const role = MEMBER_TYPES.find((t) => t.toLowerCase() === (record.role ?? '').toLowerCase());

    out.push({
      name: name.trim(),
      firstName,
      lastName,
      // An unrecognised type becomes the generic Member rather than failing
      // the row — a spreadsheet saying "volunteer" is still a person.
      role: role ?? 'Member',
      email: record.email ?? '',
      phone: record.phone ?? '',
      membershipStatus: 'active',
      membershipExpires: '',
      notes: record.notes ?? '',
      extraFields: extra,
    });
  }

  return out;
}
