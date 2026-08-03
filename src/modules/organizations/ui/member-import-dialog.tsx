'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/shadcn/dialog';
import { Button } from '@/shared/ui/shadcn/button';
import { MEMBER_TYPES } from '../constants';
import { useImportMembers } from '../hooks/use-member-mutations';
import type { CreateMemberInput } from '../schemas';

/**
 * How each known field is found in a header row.
 *
 * Matched by *substring*, not equality, and in this order — "Rider First Name"
 * and "Contact Email" are what real spreadsheets look like, and an exact-match
 * lookup silently demotes both to custom fields. 'first' and 'last' are tried
 * before 'name' so "First name" is not claimed by the plain-name rule.
 */
const HEADER_MATCHERS: { field: keyof CreateMemberInput; needles: string[] }[] = [
  { field: 'firstName', needles: ['first'] },
  { field: 'lastName', needles: ['last'] },
  { field: 'name', needles: ['name'] },
  { field: 'role', needles: ['type', 'role'] },
  { field: 'phone', needles: ['phone'] },
  { field: 'email', needles: ['email'] },
  { field: 'notes', needles: ['notes'] },
];

/** Positional columns for a file with no header row, from onMemberFile's `idx` default. */
const HEADERLESS_ORDER: (keyof CreateMemberInput)[] = ['name', 'role', 'phone', 'email', 'notes'];

/** What a header row looks like — the same test onMemberFile uses. */
const LOOKS_LIKE_HEADER = /first|last|name|type|role|email/i;

interface ParsedColumn {
  /** The known field this column fills, or null when it is a custom one. */
  field: keyof CreateMemberInput | null;
  /** Header text, for a custom column and for the field picker's label. */
  header: string;
  index: number;
}

/**
 * Splits one CSV line, honouring quoted cells.
 *
 * Written out rather than split(',') because a Notes column with a comma in it
 * is the normal case, not an edge one, and a naive split silently shifts every
 * column after it.
 */
function parseLine(line: string): string[] {
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

/**
 * "Upload List" — a CSV of people, straight into the database.
 *
 * Any column the file carries beyond the known ones is kept as an extra field
 * rather than dropped, so an organizer's own spreadsheet columns survive the
 * round-trip through export.
 */
export function MemberImportDialog({ onClose }: { onClose: () => void }) {
  const [columns, setColumns] = useState<ParsedColumn[]>([]);
  const [dataLines, setDataLines] = useState<string[]>([]);
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');

  const importMembers = useImportMembers({ onSuccess: onClose });

  /**
   * Reads the file into columns and rows, without building members yet.
   *
   * The field picker runs between this and the import, so which columns are
   * used is a decision the organizer makes after seeing what the file has.
   */
  function parse(text: string) {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) {
      setError('That file looks empty.');
      return;
    }

    const first = lines[0] ?? '';
    const hasHeader = LOOKS_LIKE_HEADER.test(first);

    let cols: ParsedColumn[];
    if (hasHeader) {
      const headers = parseLine(first);
      const claimed = new Set<keyof CreateMemberInput>();
      cols = headers.map((header, index) => {
        const lower = header.toLowerCase();
        const match = HEADER_MATCHERS.find(
          (m) => !claimed.has(m.field) && m.needles.some((n) => lower.includes(n))
        );
        if (match) claimed.add(match.field);
        return { field: match?.field ?? null, header, index };
      });
    } else {
      // No header row: the columns are positional, and every row is data.
      cols = HEADERLESS_ORDER.map((field, index) => ({ field, header: field, index }));
    }

    setError(null);
    setColumns(cols);
    setDataLines(hasHeader ? lines.slice(1) : lines);
    setExcluded(new Set());
  }

  /**
   * Turns the parsed file into members, honouring the field picker.
   *
   * Name is always brought in — a record cannot exist without one — so it is
   * never offered as something to exclude.
   */
  function buildRows(): CreateMemberInput[] {
    const out: CreateMemberInput[] = [];

    for (const line of dataLines) {
      const cells = parseLine(line);
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

  // Everything the file offers to leave out — name is not among them.
  const pickable = columns.filter((c) => c.field !== 'name' && c.field !== 'firstName' && c.field !== 'lastName');
  const rowCount = dataLines.length;

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-hunter-deep">Upload a list</DialogTitle>
          <DialogDescription>
            A CSV with a header row. First name, Last name, Type, Phone, Email and Notes are
            recognised — any other column is kept against each person as an extra field.
          </DialogDescription>
        </DialogHeader>

        <div className="my-4">
          {columns.length === 0 ? (
            <input
              type="file"
              accept=".csv,text/csv"
              className="text-[13px]"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setFileName(file.name);
                void file.text().then(parse);
              }}
            />
          ) : (
            <>
              <p className="mb-3 text-[13px] text-[#6E7C76]">
                Found <b>{rowCount}</b> {rowCount === 1 ? 'row' : 'rows'} in {fileName} with these
                columns. Name is always brought in; everything else is checked by default — uncheck
                anything you&apos;d rather leave out.
              </p>

              {pickable.length === 0 ? (
                <p className="text-[13px] text-[#7A8781]">
                  Just names in this file — nothing else to choose.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {pickable.map((col) => (
                    <label
                      key={col.header}
                      className="flex cursor-pointer items-center gap-2.5 text-[13.5px]"
                    >
                      <input
                        type="checkbox"
                        checked={!excluded.has(col.header)}
                        onChange={() => {
                          setExcluded((prev) => {
                            const next = new Set(prev);
                            if (next.has(col.header)) next.delete(col.header);
                            else next.add(col.header);
                            return next;
                          });
                        }}
                      />
                      {col.header}
                      {!col.field && (
                        <span className="text-[11.5px] text-[#98A29D]">custom field</span>
                      )}
                    </label>
                  ))}
                </div>
              )}
            </>
          )}

          {error && <p className="mt-3 text-[13px] text-[#B4432F]">{error}</p>}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={columns.length === 0 || importMembers.isPending}
            onClick={() => {
              const rows = buildRows();
              if (rows.length === 0) {
                setError('No rows in that file had a name.');
                return;
              }
              importMembers.mutate({ rows });
            }}
          >
            {importMembers.isPending ? 'Importing…' : 'Import →'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
