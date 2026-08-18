import type { CreateMemberInput } from '@/modules/organizations/schemas';
import { parseMemberCsvLine } from '@/modules/organizations/utils/parse-member-csv-line';

/** One column of a parsed member-list CSV upload. */
export interface ParsedMemberCsvColumn {
  /** The known field this column fills, or null when it is a custom one. */
  field: keyof CreateMemberInput | null;
  /** Header text, for a custom column and for the field picker's label. */
  header: string;
  index: number;
}

export interface DetectedMemberCsv {
  columns: ParsedMemberCsvColumn[];
  dataLines: string[];
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
