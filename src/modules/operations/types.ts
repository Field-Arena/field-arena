/* Shared shapes for the operations board.
 *
 * These live here rather than in data/queries.ts because that file is
 * `server-only` — a UI component or pure util importing a type from it would
 * pull the server module into the client bundle. */

export interface ScheduleEntry {
  num: string;
  rider: string;
  horse: string;
  draw: number;

  finalPctRaw: string | null;

  finalPctNum: number | null;

  /** Collectives total — the placing tie-break. */
  ctot: number | null;

  /** Test ridden when it overrides the class test (Test of Choice). */
  testName: string | null;
}

export interface ScheduleClass {
  id: string;
  label: string;
  ring: string | null;
  date: string | null;
  time: string | null;
  status: 'upcoming' | 'running' | 'done';
  entryCount: number;
  scoredCount: number;

  entries: ScheduleEntry[];

  placings: (ScheduleEntry & { place: number })[];
}

/** One ride in the cross-class "best scores" leaderboard. */
export interface BestScoreRow {
  num: string;
  rider: string;
  horse: string;
  pct: number;
  pctRaw: string | null;
  discipline: string;
  className: string;
}

/** A finished show this staff member worked, with its final placings. */
export interface PastShowResult {
  showId: string;
  showName: string;
  date: string | null;
  classes: ScheduleClass[];
}

export interface OperationsShow {
  id: string;
  slug: string | null;
  name: string;
  dateLabel: string | null;
}

export interface RiderDirectoryRow {
  num: string;
  name: string;
  horse: string;
  stable: string | null;
  classNames: string[];
}

export interface HorseDirectoryRow {
  key: string;
  horseName: string;
  riderName: string;
  trainer: string | null;
  stable: string | null;
}

export interface StablingStall {
  stable: string;
  label: string;
  horseName: string;
  riderName: string;

  num: string | null;
}

export interface StablingData {
  published: boolean;
  stalls: StablingStall[];
}

export interface VendorRow {
  id: string;
  name: string;
  status: string;
  productsOffered: string | null;
  contact: string | null;
  contactName: string | null;
  phone: string | null;
  itemCount: number;
}

export interface ShowDocumentRow {
  id: string;
  name: string;

  url: string | null;
}
