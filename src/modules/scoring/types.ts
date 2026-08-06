import type { TestDefinition } from './scoring-engine';

export type { TestDefinition, TestMovement, TestCollective, Sheet, Score } from './scoring-engine';

/** One mark's value plus who last wrote it — the judge-locks-scribe rule reads this. */
export interface MarkEntry {
  value: number | null;
  enteredBy: 'judge' | 'scribe' | null;
}

/** A `scores` row, camelCased. Richer than scoring-engine's `Sheet` — carries
 *  per-mark authorship, which the pure calc functions don't need. */
export interface ScoreRow {
  id: string;
  entryId: string;
  seatId: string;
  movements: Record<string, MarkEntry>;
  collectives: Record<string, MarkEntry>;
  errors: number;
  errorAt: Record<string, boolean>;
  remarks: Record<string, string>;
  finalRemarks: string;
  submitted: boolean;
  signedBy: string | null;
  signedAt: string | null;
  updatedAt: string;
}

export interface PanelSeat {
  seatId: string;
  position: string | null;
  judgeStaffId: string | null;
  judgeName: string | null;
  scribeStaffId: string | null;
  scribeName: string | null;
}

/** A `class_entries` row, camelCased. */
export interface RideEntry {
  id: string;
  num: string;
  rider: string | null;
  horse: string | null;
  rideOrder: number;
  draw: number | null;
  status: 'scheduled' | 'scored' | 'scratched' | 'disqualified';
  holding: boolean;
  advancedPast: boolean;
  finalPct: string | null;
  judgePct: Record<string, string>;
  collectiveTotal: number | null;
  correction: string | null;
  reason: string | null;
  finalizedAt: string | null;
  testOverride: TestDefinition | null;
}

export interface ClassScoringState {
  classId: string;
  showName: string;
  className: string;
  /** Null when neither `class_tests` nor a catalog match resolved one — see queries.ts. */
  test: TestDefinition | null;
  panel: PanelSeat[];
  entries: RideEntry[];
  holdingEntries: RideEntry[];
  scores: ScoreRow[];
  classState: {
    open: boolean;
    /** Index into `entries` (ride_order sorted) — "the first unfinished entry." */
    pos: number;
    workingInEntryId: string | null;
    resultsPublished: boolean;
  };
}

export type SeatRole = 'judge' | 'scribe';

/** Which seat, if any, the signed-in caller holds on this class's panel. */
export interface MySeat {
  seatId: string;
  role: SeatRole;
  staffId: string;
  name: string;
}
