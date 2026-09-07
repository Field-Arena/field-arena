function escapeCsvField(value: string | null | undefined): string {
  const v = value ?? '';
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

export function buildResultsCsv(
  rows: {
    className: string;
    division: string | null;
    num: string;
    rider: string;
    horse: string;
    testName: string | null;
    pct: number | null;
    rank: number | null;
  }[],
): string {
  const header = 'Class,Division,Number,Rider,Horse,Test,Score %,Place\n';
  const body = rows
    .map((r) =>
      [
        escapeCsvField(r.className),
        escapeCsvField(r.division ?? ''),
        escapeCsvField(r.num),
        escapeCsvField(r.rider),
        escapeCsvField(r.horse),
        escapeCsvField(r.testName ?? ''),
        r.pct != null ? r.pct.toFixed(3) : '',
        r.rank != null ? String(r.rank) : '',
      ].join(','),
    )
    .join('\n');
  return header + body + (rows.length > 0 ? '\n' : '');
}
