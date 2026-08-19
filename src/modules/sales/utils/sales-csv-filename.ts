/** Matches modules/staff/utils.ts's staffCsvFilename slugging convention. */
export function salesCsvFilename(showName: string): string {
  const slug = showName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return `field-and-arena-sales-contacts-${slug || 'show'}.csv`;
}
