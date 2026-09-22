function escapeCsvField(value: string | null | undefined): string {
  const v = value ?? '';
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

export function buildResultsCsv(
  rows: {
    unitLabel: string;
    className: string;
    division: string | null;
    num: string;
    rider: string;
    horse: string;
    testName: string | null;
    pct: number | null;
    rank: number | null;
    ribbonName: string | null;
  }[],
): string {
  const header = 'Group,Class,Division,Number,Rider,Horse,Test,Score %,Place,Ribbon\n';
  const body = rows
    .map((r) =>
      [
        escapeCsvField(r.unitLabel),
        escapeCsvField(r.className),
        escapeCsvField(r.division ?? ''),
        escapeCsvField(r.num),
        escapeCsvField(r.rider),
        escapeCsvField(r.horse),
        escapeCsvField(r.testName ?? ''),
        r.pct != null ? r.pct.toFixed(3) : '',
        r.rank != null ? String(r.rank) : '',
        escapeCsvField(r.ribbonName ?? ''),
      ].join(','),
    )
    .join('\n');
  return header + body + (rows.length > 0 ? '\n' : '');
}
