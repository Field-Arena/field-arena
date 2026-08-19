import type { Metadata } from 'next';
import Link from 'next/link';
import { listMyAssignments, listPanelContacts } from '@/modules/judging/data/queries';
import { getStaffProfile } from '@/modules/auth/data/queries';
import { buildDemoAssignments } from '@/modules/judging/utils/build-demo-assignments';
import { buildDemoPanelContacts } from '@/modules/judging/utils/build-demo-panel-contacts';
import { buildTodaySnapshot } from '@/modules/judging/utils/build-today-snapshot';
import { classifyAssignment } from '@/modules/judging/utils/classify-assignment';
import { JudgingStatusCard } from '@/modules/judging/ui/judging-status-card';
import { AssignmentCard } from '@/modules/judging/ui/assignment-card';
import { Card, ScreenLede, ScreenTitle } from '@/shared/ui/organizer/card';
import { StatusPill } from '@/shared/ui/organizer/status-pill';
import { SuperAdminPreviewNotice } from '@/modules/judging/ui/superadmin-preview-notice';

export const metadata: Metadata = { title: 'My Assignments — Field & Arena' };

/**
 * The Judge and Scribe workspace's "My Assignments" tab, rebuilt to match
 * Judge Workspace.dc.html — today's ring times, then everything upcoming.
 * Not scoped to one show, unlike the organizer pages: an official works
 * across organizations and needs one list of everything they are booked on.
 */
export default async function JudgingPage() {
  const todayIso = new Date().toISOString().slice(0, 10);
  const [profile, realAssignments, realPanelContacts] = await Promise.all([
    getStaffProfile(),
    listMyAssignments(),
    listPanelContacts(),
  ]);
  const isSuperAdminPreview = profile?.platform_role === 'SuperAdmin';
  const assignments = isSuperAdminPreview ? buildDemoAssignments(todayIso) : realAssignments;
  const panelContacts = isSuperAdminPreview ? buildDemoPanelContacts() : realPanelContacts;
  const roleLabel = profile?.platform_role === 'Scribe' ? 'Scribe' : 'Judge';
  const { rings, contacts, assignmentsToday } = buildTodaySnapshot(
    assignments,
    panelContacts,
    todayIso,
  );

  const today = assignments.filter((a) => classifyAssignment(a, todayIso) === 'today');
  const upcoming = assignments.filter((a) => classifyAssignment(a, todayIso) === 'upcoming');
  const upcomingCount = today.length + upcoming.length;

  return (
    <>
      <div className="mb-[22px] flex flex-wrap items-start justify-between gap-5">
        <div>
          <ScreenTitle>My Assignments</ScreenTitle>
          <ScreenLede className="mb-0">
            Today&apos;s ring times and every show you&apos;re on the panel for.
          </ScreenLede>
        </div>
        <StatusPill bg="#FFFFFF" border="#E9EDEB" fg="#16261F" icon={<GoldDot />}>
          {roleLabel} · {upcomingCount} upcoming assignment{upcomingCount === 1 ? '' : 's'}
        </StatusPill>
      </div>

      {isSuperAdminPreview && <SuperAdminPreviewNotice />}

      <JudgingStatusCard rings={rings} contacts={contacts} assignmentsToday={assignmentsToday} />

      {today.length > 0 && (
        <Link
          href="/dashboard/judging/results"
          className="hover:text-gold mb-3.5 inline-block text-[13px] font-semibold text-[#5A6B63]"
        >
          🏆 View Results
        </Link>
      )}

      {assignments.length === 0 ? (
        <Card className="p-[60px_20px] text-center text-[14.5px] text-[#7A8781]">
          You are not on any class panel. An organizer assigns a {roleLabel.toLowerCase()} to a
          class from ShowManager, and it appears here once they do.
        </Card>
      ) : (
        <>
          <h3 className="text-ink-deep mb-3.5 font-[Newsreader,serif] text-[19px] font-semibold">
            Today&apos;s Ring Times
          </h3>
          <div className="mb-8 flex flex-col gap-3">
            {today.length === 0 ? (
              <Card className="p-[24px_20px] text-[13.5px] text-[#7A8781]">
                Nothing on the panel for you today.
              </Card>
            ) : (
              today.map((a) => (
                <AssignmentCard key={`${a.classId}-${a.seatId}`} assignment={a} variant="today" />
              ))
            )}
          </div>

          <h3 className="text-ink-deep mb-3.5 font-[Newsreader,serif] text-[19px] font-semibold">
            Upcoming
          </h3>
          <div className="flex flex-col gap-3">
            {upcoming.length === 0 ? (
              <Card className="p-[24px_20px] text-[13.5px] text-[#7A8781]">
                Nothing else scheduled yet.
              </Card>
            ) : (
              upcoming.map((a) => (
                <AssignmentCard
                  key={`${a.classId}-${a.seatId}`}
                  assignment={a}
                  variant="upcoming"
                />
              ))
            )}
          </div>
        </>
      )}
    </>
  );
}

function GoldDot() {
  return <span className="bg-gold size-2 rounded-full" />;
}
