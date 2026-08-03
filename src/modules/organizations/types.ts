/**
 * The venue library's own record shapes — see constants.ts's doc comment for
 * why these are a local copy rather than an import from shows/data/setup-queries.ts's
 * RingRow, even though the wire shape (`{name, size}`) matches on purpose.
 */

export interface VenueRing {
  name: string;
  size: 'standard' | 'small';
}

/**
 * One stall in a venue's saved stable layout. Carries a stable id (`vst…`,
 * ported from legacy's `locStallIdGen`) so renaming/closing a stall by
 * position survives a resize — see `resizeStalls` in utils.ts.
 */
export interface VenueStall {
  id: string;
  number: number;
  label: string;
  closed: boolean;
}

/**
 * A stable at this venue. `stallCount` is not stored separately — it is
 * always `stalls.length`, matching how legacy derives it in
 * `locStableRowsHtml` (`(stable.stalls||[]).length`) rather than trusting a
 * second field that could drift out of sync with the array.
 */
export interface VenueStable {
  name: string;
  rowCount: number;
  stalls: VenueStall[];
}

export interface VenueListItem {
  id: string;
  name: string;
  address: string | null;
  website: string | null;
  phone: string | null;
  contact: string | null;
  city: string | null;
  region: string | null;
  rings: VenueRing[];
  stables: VenueStable[];
  /** Shows in this org whose venue_id points at this venue. */
  showCount: number;
}
