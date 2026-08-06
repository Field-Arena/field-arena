import type { Metadata } from 'next';
import Link from 'next/link';
import { listMyAssignments, listPanelContacts } from '@/modules/judging/data/queries';
import { getStaffProfile } from '@/modules/auth/data/queries';
import {
  buildDemoAssignments,
  buildDemoPanelContacts,
  buildTodaySnapshot,
  classifyAssignment,
} from '@/modules/judging/utils';
import { JudgingStatusCard } from '@/modules/judging/ui/judging-status-card';
import { AssignmentCard } from '@/modules/judging/ui/assignment-card';
import { SuperAdminPreviewNotice } from '@/modules/judging/ui/superadmin-preview-notice';
import { Card, ScreenLede, ScreenTitle } from '@/shared/ui/organizer/card';

export const metadata: Metadata = { title: 'History — Field & Arena' };

/** Classes this person has completed — published results, or dates already past. */
export default async function JudgingHistoryPage() {
  const todayIso = new Date().toISOString().slice(0, 10);
  const [profile, assignments, realContacts] = await Promise.all([
    getStaffProfile(),
    listMyAssignments(),
    listPanelContacts(),
  ]);
  const isSuperAdminPreview = profile?.platform_role === 'SuperAdmin';
  // Only the status card's ring/panel strip borrows the demo data, for the
  // same "Ring 1" consistency the design shows on every tab — the History
  // list itself stays real (and so, for a SuperAdmin, empty): neither the
  // design nor legacy's own demo judge ever had completed classes to show.
  const snapshotAssignments = isSuperAdminPreview ? buildDemoAssignments(todayIso) : assignments;
  const snapshotContacts = isSuperAdminPreview ? buildDemoPanelContacts() : realContacts;
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

      {isSuperAdminPreview && <SuperAdminPreviewNotice />}

      <JudgingStatusCard rings={snapshot.rings} contacts={snapshot.contacts} />

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
