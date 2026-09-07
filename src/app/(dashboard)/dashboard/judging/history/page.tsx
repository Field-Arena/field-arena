import type { Metadata } from 'next';
import Link from 'next/link';
import {
  listMyAssignments,
  listPanelContacts,
  getPreviewShowName,
} from '@/modules/judging/data/queries';
import { getStaffProfile } from '@/modules/auth/data/queries';
import { buildDemoAssignments } from '@/modules/judging/utils/build-demo-assignments';
import { buildDemoPanelContacts } from '@/modules/judging/utils/build-demo-panel-contacts';
import { buildTodaySnapshot } from '@/modules/judging/utils/build-today-snapshot';
import { classifyAssignment } from '@/modules/judging/utils/classify-assignment';
import { JudgingStatusCard } from '@/modules/judging/ui/judging-status-card';
import { AssignmentCard } from '@/modules/judging/ui/assignment-card';
import { SuperAdminPreviewNotice } from '@/modules/judging/ui/superadmin-preview-notice';
import { Card, ScreenLede, ScreenTitle } from '@/shared/ui/organizer/card';

export const metadata: Metadata = { title: 'History — Field & Arena' };

export default async function JudgingHistoryPage() {
  const todayIso = new Date().toISOString().slice(0, 10);
  const [profile, assignments, realContacts] = await Promise.all([
    getStaffProfile(),
    listMyAssignments(),
    listPanelContacts(),
  ]);
  const isSuperAdminPreview = profile?.platform_role === 'SuperAdmin';
  // Real rows come back whenever a show is being previewed; the demo builders
  // are the fallback for a SuperAdmin who hasn't picked one.
  const previewShowName = isSuperAdminPreview ? await getPreviewShowName() : null;
  const useDemoData = isSuperAdminPreview && previewShowName === null;

  const snapshotAssignments = useDemoData ? buildDemoAssignments(todayIso) : assignments;
  const snapshotContacts = useDemoData ? buildDemoPanelContacts() : realContacts;
  const snapshot = buildTodaySnapshot(snapshotAssignments, snapshotContacts, todayIso);
  const history = assignments.filter((a) => classifyAssignment(a, todayIso) === 'history');

  return (
    <>
      <div className="mb-[22px]">
        <ScreenTitle>History</ScreenTitle>
        <ScreenLede className="mb-0">
          Classes you&apos;ve completed — your record on this platform.
        </ScreenLede>
      </div>

      {isSuperAdminPreview && <SuperAdminPreviewNotice showName={previewShowName} />}

      <JudgingStatusCard
        rings={snapshot.rings}
        contacts={snapshot.contacts}
        assignmentsToday={snapshot.assignmentsToday}
      />

      {history.length === 0 ? (
        <Card className="p-[60px_20px] text-center text-[14.5px] text-[#7A8781]">
          No completed assignments yet.
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {history.map((a) => (
            <Link
              key={`${a.classId}-${a.seatId}`}
              href={`/dashboard/judging/history/${a.classId}`}
              className="block"
            >
              <AssignmentCard assignment={a} variant="history" />
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
