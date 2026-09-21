// Same regex shape as the shows_slug_unique_idx backfill migration
// (20260921160000_show_slugs.sql) — app-side generation and the DB
// backfill must agree on what a "base slug" looks like.
export function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || 'show';
}
