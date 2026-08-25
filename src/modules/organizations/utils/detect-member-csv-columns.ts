import type { CreateMemberInput } from '@/modules/organizations/schemas';
import { parseMemberCsvLine } from '@/modules/organizations/utils/parse-member-csv-line';

export interface ParsedMemberCsvColumn {
  field: keyof CreateMemberInput | null;
  header: string;
  index: number;
}

export interface DetectedMemberCsv {
  columns: ParsedMemberCsvColumn[];
  dataLines: string[];
}

const MEMBER_CSV_HEADER_MATCHERS: { field: keyof CreateMemberInput; needles: string[] }[] = [
  { field: 'firstName', needles: ['first'] },
  { field: 'lastName', needles: ['last'] },
  { field: 'name', needles: ['name'] },
  { field: 'role', needles: ['type', 'role'] },
  { field: 'phone', needles: ['phone'] },
  { field: 'email', needles: ['email'] },
  { field: 'notes', needles: ['notes'] },
];

const MEMBER_CSV_HEADERLESS_ORDER: (keyof CreateMemberInput)[] = [
  'name',
  'role',
  'phone',
  'email',
  'notes',
];

const MEMBER_CSV_LOOKS_LIKE_HEADER = /first|last|name|type|role|email/i;

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
    columns = MEMBER_CSV_HEADERLESS_ORDER.map((field, index) => ({ field, header: field, index }));
  }

  return { columns, dataLines: hasHeader ? lines.slice(1) : lines };
}
