function escapeCsvField(value: string | null | undefined): string {
  const v = value ?? '';
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

export function buildSalesCsv(
  rows: {
    customer: string;
    type: string;
    showName: string;
    date: string | null;
    amountTotal: number;
    statusLabel: string;
  }[],
): string {
  const header = 'Customer,Type,Show,Date,Total,Status\n';
  const body = rows
    .map((r) =>
      [
        escapeCsvField(r.customer),
        escapeCsvField(r.type),
        escapeCsvField(r.showName),
        escapeCsvField(r.date ?? ''),
        r.amountTotal.toFixed(2),
        escapeCsvField(r.statusLabel),
      ].join(','),
    )
    .join('\n');
  return header + body + (rows.length > 0 ? '\n' : '');
}
