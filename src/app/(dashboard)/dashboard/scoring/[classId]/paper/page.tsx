import type { Metadata } from 'next';
import { canManageClassScoring, getScoringState } from '@/modules/scoring/data/queries';
import { PaperEntryScreen } from '@/modules/scoring/ui/paper-entry-screen';
import { EmptyPanel } from '@/shared/ui/workspace-page';
import { isUuid } from '@/shared/lib/utils';

export const metadata: Metadata = { title: 'Enter paper score sheets — Field & Arena' };

export default async function PaperScoreEntryPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;

  if (!isUuid(classId) || !(await canManageClassScoring(classId))) {
    return (
      <EmptyPanel
        title="Paper score entry isn't available"
        note="Only show management can type in paper score sheets for this class."
      />
    );
  }

  const state = await getScoringState(classId);
  return <PaperEntryScreen classId={classId} state={state} />;
}
