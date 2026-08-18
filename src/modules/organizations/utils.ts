import type { VenueStall } from './types';
import type { MemberRow } from './data/queries';
import { MEMBER_CSV_HEADERS, MEMBER_TYPES } from './constants';
import type { CreateMemberInput } from './schemas';

let stallSeq = 0;

/**
 * A locally-unique stall id, ported from legacy's `locStallIdGen` (`'vst'+Date.now()+…`).
 * A monotonic counter is appended instead of `Math.random()` so two stalls
 * created within the same millisecond (a fast double-click on "+ Add stall
 * row", or two calls in the same render) can never collide.
 */
export function newStallId(): string {
  stallSeq += 1;
  return `vst${String(Date.now())}${String(stallSeq)}`;
}

/**
 * Rebuilds a stable's stall array to a new target count, ported verbatim from
 * legacy's `locStableSetCount`: existing stalls keep their label/closed state
 * *by position* rather than being wiped, so widening a barn never loses
 * stalls that are already named and in use. Shrinking simply drops the tail.
 */
export function resizeStalls(existing: VenueStall[], count: number): VenueStall[] {
  const n = Math.max(0, Math.floor(count) || 0);
  const stalls: VenueStall[] = [];
  for (let i = 0; i < n; i++) {
    const number = i + 1;
    const prior = existing[i];
    stalls.push(prior ? { ...prior, number } : { id: newStallId(), number, label: String(number), closed: false });
  }
  return stalls;
}

// ── Member Database: CSV export ─────────────────────────────────────────────

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

// ── Member Database: CSV import ─────────────────────────────────────────────

export interface ParsedMemberCsvColumn {
  /** The known field this column fills, or null when it is a custom one. */
  field: keyof CreateMemberInput | null;
  /** Header text, for a custom column and for the field picker's label. */
  header: string;
  index: number;
}

/**
 * How each known field is found in a header row.
 *
 * Matched by *substring*, not equality, and in this order — "Rider First Name"
 * and "Contact Email" are what real spreadsheets look like, and an exact-match
 * lookup silently demotes both to custom fields. 'first' and 'last' are tried
 * before 'name' so "First name" is not claimed by the plain-name rule.
 */
const MEMBER_CSV_HEADER_MATCHERS: { field: keyof CreateMemberInput; needles: string[] }[] = [
  { field: 'firstName', needles: ['first'] },
  { field: 'lastName', needles: ['last'] },
  { field: 'name', needles: ['name'] },
  { field: 'role', needles: ['type', 'role'] },
  { field: 'phone', needles: ['phone'] },
  { field: 'email', needles: ['email'] },
  { field: 'notes', needles: ['notes'] },
];

/** Positional columns for a file with no header row. */
const MEMBER_CSV_HEADERLESS_ORDER: (keyof CreateMemberInput)[] = [
  'name',
  'role',
  'phone',
  'email',
  'notes',
];

/** What a header row looks like — the same test used to decide whether to skip the first line. */
const MEMBER_CSV_LOOKS_LIKE_HEADER = /first|last|name|type|role|email/i;

/**
 * Splits one CSV line, honouring quoted cells.
 *
 * Written out rather than split(',') because a Notes column with a comma in it
 * is the normal case, not an edge one, and a naive split silently shifts every
 * column after it.
 */
export function parseMemberCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cell = '';
  let quoted = false;

  for (let i = 0; i < line.length; i++) {
    // Indexing a string is `string | undefined` under noUncheckedIndexedAccess,
    // even inside a length-bounded loop.
    const char = line[i] ?? '';
    if (quoted) {
      if (char === '"' && line[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      cells.push(cell);
      cell = '';
    } else {
      cell += char;
    }
  }
  cells.push(cell);
  return cells.map((c) => c.trim());
}

export interface DetectedMemberCsv {
  columns: ParsedMemberCsvColumn[];
  dataLines: string[];
}

/**
 * Reads a member-list CSV's text into columns and data rows, without building
 * members yet — the field picker runs between this and
 * buildMemberRowsFromCsv, so which columns are used is a decision the
 * organizer makes after seeing what the file has.
 */
export function detectMemberCsvColumns(text: string): DetectedMemberCsv | { error: string } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) {
    return { error: 'That file looks empty.' };
  }

  const first = lines[0] ?? '';
  const hasHeader = MEMBER_CSV_LOOKS_LIKE_HEADER.test(first);

  let columns: ParsedMemberCsvColumn[];
  if (hasHeader) {
    const headers = parseMemberCsvLine(first);
    const claimed = new Set<keyof CreateMemberInput>();
    columns = headers.map((header, index) => {
      const lower = header.toLowerCase();
      const match = MEMBER_CSV_HEADER_MATCHERS.find(
        (m) => !claimed.has(m.field) && m.needles.some((n) => lower.includes(n)),
      );
      if (match) claimed.add(match.field);
      return { field: match?.field ?? null, header, index };
    });
  } else {
    // No header row: the columns are positional, and every row is data.
    columns = MEMBER_CSV_HEADERLESS_ORDER.map((field, index) => ({ field, header: field, index }));
  }

  return { columns, dataLines: hasHeader ? lines.slice(1) : lines };
}

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
