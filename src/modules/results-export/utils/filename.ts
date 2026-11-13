/* field-and-arena-results-<show-name-slug>.<ext> */
export function exportFilename(showName: string, extension: string): string {
  const slug = showName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return `field-and-arena-results-${slug || 'show'}.${extension}`;
}
