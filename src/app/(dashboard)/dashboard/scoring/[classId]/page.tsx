import type { Metadata } from 'next';
import { getScoringState, getMySeat, getMyScoringPermissions } from '@/modules/scoring/data/queries';
import { ScoringScreen } from '@/modules/scoring/ui/scoring-screen';

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

  const [state, mySeat, permissions] = await Promise.all([
    getScoringState(classId),
    getMySeat(classId),
    getMyScoringPermissions(classId),
  ]);

  return <ScoringScreen classId={classId} initialState={state} mySeat={mySeat} permissions={permissions} />;
}
