/** CSV field escaping — wraps in quotes (doubling any inner quote) only when the field needs it. Matches modules/staff/utils.ts's identical helper. */
function escapeCsvField(value: string | null | undefined): string {
  const v = value ?? '';
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

/**
 * Builds the "Export Contact List" CSV for Event Sales — every row currently
 * matching the screen's search/type filter, same columns as the visible
 * table (Customer, Type, Show, Date, Total, Status), so what downloads is
 * exactly what was on screen when the button was clicked.
 */
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
