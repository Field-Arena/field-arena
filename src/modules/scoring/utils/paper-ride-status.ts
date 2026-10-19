import { scoreLabel } from '@/modules/scoring/scoring-engine';
import { parseFinalPct } from '@/modules/scoring/utils/parse-final-pct';
import type { RideEntry, ScoreRow } from '@/modules/scoring/types';

export type PaperRideState = 'todo' | 'paper' | 'live' | 'scratched' | 'eliminated';

export interface PaperRideStatus {
  state: PaperRideState;
  label: string;
  /** A sheet can be typed in (or re-typed) for this ride. */
  canEnter: boolean;
}

/** Where a ride stands on the paper-entry screen. A ride scored live is
 * shown but left to the live screen; scratched / eliminated rides need that
 * undone first. */
export function paperRideStatus(entry: RideEntry, scores: readonly ScoreRow[]): PaperRideStatus {
  if (entry.status === 'scratched')
    return { state: 'scratched', label: 'Scratched', canEnter: false };
  if (entry.status === 'disqualified') {
    return { state: 'eliminated', label: 'Eliminated', canEnter: false };
  }
  if (entry.status === 'scored') {
    const own = scores.filter((s) => s.entryId === entry.id && s.submitted);
    const label = scoreLabel(parseFinalPct(entry.finalPct));
    return own.length > 0 && own.every((s) => s.enteredFromPaper)
      ? { state: 'paper', label, canEnter: true }
      : { state: 'live', label: `${label} (scored live)`, canEnter: false };
  }
  return { state: 'todo', label: 'To enter', canEnter: true };
}
