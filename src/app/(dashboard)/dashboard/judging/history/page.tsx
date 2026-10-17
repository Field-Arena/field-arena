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
import { EmptyState, PageHeader } from '@/shared/ui/organizer/fa-page';

export const metadata: Metadata = { title: 'History — Field & Arena' };

export default async function JudgingHistoryPage() {
  const todayIso = new Date().toISOString().slice(0, 10);
  const [profile, assignments, realContacts] = await Promise.all([
    getStaffProfile(),
    listMyAssignments(todayIso),
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
      <PageHeader
        eyebrow="Classes you've completed — your record on this platform"
        title="History"
      />

      {isSuperAdminPreview && <SuperAdminPreviewNotice showName={previewShowName} />}

      <JudgingStatusCard
        rings={snapshot.rings}
        contacts={snapshot.contacts}
        assignmentsToday={snapshot.assignmentsToday}
      />

      {history.length === 0 ? (
        <EmptyState title="No completed assignments yet." />
      ) : (
        <div className="flex flex-col gap-2.5">
          {history.map((a) => (
            <Link
              key={`${a.classId}-${a.seatId}`}
              href={`/dashboard/judging/history/${a.classId}`}
              className="block rounded-[16px] no-underline transition-shadow hover:shadow-[0_0_0_3px_#E9F4EE]"
            >
              <AssignmentCard assignment={a} variant="history" />
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
