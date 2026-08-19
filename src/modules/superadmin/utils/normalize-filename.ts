export function normalizeFilename(s: string): string {
  return s
    .replace(/\.[^.]+$/, '')
    .replace(/(19|20)\d{2}/g, '')
    .replace(/[^a-z0-9]/gi, '')
    .toLowerCase();
}
