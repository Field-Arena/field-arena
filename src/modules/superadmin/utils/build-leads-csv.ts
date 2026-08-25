function escapeCsvField(value: string | number | null | undefined): string {
  const v = value === null || value === undefined ? '' : String(value);
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

export function buildLeadsCsv(
  leads: {
    org: string;
    contact: string | null;
    email: string | null;
    shows: number | null;
    status: string | null;
  }[],
): string {
  const header = 'Organization,Contact,Email,Shows/yr,Status\n';
  const body = leads
    .map((l) =>
      [
        escapeCsvField(l.org),
        escapeCsvField(l.contact),
        escapeCsvField(l.email),
        escapeCsvField(l.shows),
        escapeCsvField(l.status),
      ].join(','),
    )
    .join('\n');
  return header + body + (leads.length > 0 ? '\n' : '');
}
