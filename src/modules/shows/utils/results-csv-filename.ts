export function resultsCsvFilename(showName: string): string {
  const slug = showName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return `field-and-arena-results-${slug || 'show'}.csv`;
}
