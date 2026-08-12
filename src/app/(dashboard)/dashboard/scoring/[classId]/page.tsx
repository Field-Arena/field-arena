import type { Metadata } from 'next';
import {
  getScoringState,
  getMySeat,
  getMyScoringPermissions,
  listPanelCandidates,
} from '@/modules/scoring/data/queries';
import { ScoringScreen } from '@/modules/scoring/ui/scoring-screen';
import { EmptyPanel } from '@/modules/staff/ui/workspace-page';
import { isUuid } from '@/shared/lib/utils';

export const metadata: Metadata = { title: 'Scoring — Field & Arena' };

/**
 * The live-scoring screen — one class at a time, entering marks against its
 * test definition. RLS (`canEnterScores`/`canScratch`/`canSkip`/
 * `canEliminate`) is the real access boundary; this page does no extra
 * gating of its own beyond what `getScoringState`'s own `can_view_show`
 * check already requires.
 */
export default async function ScoringPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;

  // A malformed id (e.g. the demo judging panel's placeholder "demo-class-today-0",
  // which is not a UUID) is not "not found" to Postgres — querying a uuid column
  // with it raises a raw 22P02 invalid-input-syntax error that surfaces as a
  // runtime crash. Rule it out up front, same guard the Show Manager page uses.
  if (!isUuid(classId)) {
    return (
      <EmptyPanel
        title="Class not found"
        note="This scoring class doesn't exist, or you don't have access to it."
      />
    );
  }

  const [state, mySeat, permissions, panelCandidates] = await Promise.all([
    getScoringState(classId),
    getMySeat(classId),
    getMyScoringPermissions(classId),
    listPanelCandidates(classId),
  ]);

  return (
    <ScoringScreen
      classId={classId}
      initialState={state}
      mySeat={mySeat}
      permissions={permissions}
      panelCandidates={panelCandidates}
    />
  );
}
