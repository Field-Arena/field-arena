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
