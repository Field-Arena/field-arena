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

export default async function ScoringPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = await params;

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
