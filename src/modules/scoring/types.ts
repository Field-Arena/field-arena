import type { TestDefinition } from '@/modules/scoring/scoring-engine';

export type {
  TestDefinition,
  TestMovement,
  TestCollective,
  Sheet,
  Score,
} from '@/modules/scoring/scoring-engine';

export interface MarkEntry {
  value: number | null;
  enteredBy: 'judge' | 'scribe' | null;
}

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

  rideStartedAt: string | null;
}

export interface ClassScoringState {
  classId: string;
  showName: string;
  className: string;
  sponsor: string | null;

  test: TestDefinition | null;
  panel: PanelSeat[];
  entries: RideEntry[];
  holdingEntries: RideEntry[];
  scores: ScoreRow[];
  classState: {
    open: boolean;

    pos: number;
    workingInEntryId: string | null;
    resultsPublished: boolean;
  };

  scheduledTime: string | null;

  ring: string | null;
}

export type SeatRole = 'judge' | 'scribe';

export interface MySeat {
  seatId: string;
  role: SeatRole;
  staffId: string;
  name: string;
}
