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
