/**
 * The organization's reusable venue library — name/contact, a saved
 * ring/arena layout, and a saved stable/stall layout, ported from
 * showstaff.html's Locations section (~lines 5235-5417).
 */

/**
 * Ring size options. Deliberately a local copy of shows/schemas.ts's
 * RING_SIZES rather than an import — a module must not reach into another
 * module's internals (see .claude/rules/folder-structure.md). Both modules
 * store the same `{name, size}` shape in a `rings` jsonb column, which is
 * why the values below have to stay identical to shows' copy even though
 * the two are not the same TypeScript symbol.
 */
export const RING_SIZES = [
  { id: 'standard', label: 'Standard (20m × 60m)' },
  { id: 'small', label: 'Small (20m × 40m)' },
] as const;

/** Mirrors shows/schemas.ts's MAX_RINGS (api/shows/[id].js's MAX_LOCATIONS) — same practical ceiling on a venue's own saved layout. */
export const MAX_RINGS = 30;

/** Not from legacy — legacy has no cap on stable count. A sane engineering guard, generous enough that no real venue hits it. */
export const MAX_STABLES = 40;

/** Not from legacy — legacy has no cap on stall count. A barn's practical ceiling, generous enough that no real stable hits it. */
export const MAX_STALLS_PER_STABLE = 300;

/** Rose / lilac / gold, cycled per stat card — matches run-show-card.tsx's STAT_TINTS. */
export const VENUE_STAT_TINTS = [
  { bg: '#E3EDFB', fg: '#2E5FA8' },
  { bg: '#EEE7FA', fg: '#6B4FA0' },
  { bg: '#FCF3E4', fg: '#8A6D14' },
] as const;
