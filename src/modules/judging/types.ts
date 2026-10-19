export interface AssignmentRow {
  classId: string;
  classLabel: string;
  showId: string;
  showName: string;
  showDate: string | null;

  classDate: string | null;
  /** Today's date (YYYY-MM-DD) in the show's timezone — what classDate is
   * compared against. Per row because a judge's seats can span shows in
   * different zones, and the server runs in UTC. */
  todayIso: string;
  /** The show's IANA timezone (show, then org, then app default). */
  timeZone: string;
  classTime: string | null;
  ring: string | null;
  seatId: string;
  position: string | null;

  seatRole: 'judge' | 'scribe';

  partnerName: string | null;
  partnerRole: 'judge' | 'scribe' | null;
  entryCount: number;
  scoringOpen: boolean;
  resultsPublished: boolean;
  scoredCount: number;

  advancedCount: number;
}

export interface PanelContact {
  staffId: string;
  name: string;
  role: 'judge' | 'scribe';

  classIds: string[];
  showName: string;
  position: string | null;
  /** Judge licence / rating (e.g. USEF "R"), when the organizer set one. */
  license: string | null;
}

export interface TodayPanelContact {
  name: string;
  role: 'judge' | 'scribe';
  position: string | null;
}

export interface RideOrderEntry {
  id: string;
  num: string;
  rider: string | null;
  horse: string | null;
  rideOrder: number;
  status: string;
  finalPct: string | null;
  holding: boolean;
}

export interface ClassPlacingEntry {
  entryId: string;
  num: string;
  rider: string;
  horse: string;
  finalPct: number | null;
  ctot: number | null;
  testName: string | null;
}

export interface EntryScorecard {
  className: string;
  entryId: string;
  num: string;
  rider: string;
  horse: string;
  finalPct: string | null;
  test: {
    name: string;
    movements: { num: number; text: string; coef: number }[];
    collectives: { key: string; label: string; coef: number }[];
  } | null;

  movementMarks: Record<string, number | null>;

  movementRemarks: Record<string, string>;
  collectiveMarks: Record<string, number | null>;
}

export interface ScoredRideRow {
  entryId: string;
  classId: string;
  showName: string;
  classLabel: string;
  rider: string;
  horse: string;
  /** This seat's own percentage when the panel recorded one, else the final. */
  score: string | null;
  scoredAt: string | null;
}

export interface PanelClass {
  id: string;
  label: string;
  location: string | null;
}

export interface PanelStaff {
  id: string;
  name: string;
}
