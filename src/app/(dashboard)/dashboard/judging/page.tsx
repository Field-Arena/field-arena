import { resolveTimeZone, todayInZone } from '@/shared/lib/format/time-zone';
import type { Metadata } from 'next';
import {
  listMyAssignments,
  listPanelContacts,
  getPreviewShowName,
} from '@/modules/judging/data/queries';
import { getStaffProfile } from '@/shared/lib/auth/session';
import { buildDemoAssignments } from '@/modules/judging/utils/build-demo-assignments';
import { buildDemoPanelContacts } from '@/modules/judging/utils/build-demo-panel-contacts';
import { buildTodaySnapshot } from '@/modules/judging/utils/build-today-snapshot';
import { classifyAssignment } from '@/modules/judging/utils/classify-assignment';
import { isAssignmentComplete } from '@/modules/judging/utils/is-assignment-complete';
import { JudgingStatusCard } from '@/modules/judging/ui/judging-status-card';
import { AssignmentCard } from '@/modules/judging/ui/assignment-card';
import { SuperAdminPreviewNotice } from '@/modules/judging/ui/superadmin-preview-notice';

export const metadata: Metadata = { title: 'My Assignments — Field & Arena' };

export default async function JudgingPage() {
  // Demo rows only; real rows carry today in their own show's timezone.
  const demoTodayIso = todayInZone(resolveTimeZone());
  const [profile, realAssignments, realPanelContacts] = await Promise.all([
    getStaffProfile(),
    listMyAssignments(),
    listPanelContacts(),
  ]);
  const isSuperAdminPreview = profile?.platform_role === 'SuperAdmin';
  // Real rows come back whenever a show is being previewed; the demo builders
  // are the fallback for a SuperAdmin who hasn't picked one.
  const previewShowName = isSuperAdminPreview ? await getPreviewShowName() : null;
  const useDemoData = isSuperAdminPreview && previewShowName === null;
  const assignments = useDemoData ? buildDemoAssignments(demoTodayIso) : realAssignments;
  const panelContacts = useDemoData ? buildDemoPanelContacts() : realPanelContacts;
  const roleLabel = profile?.platform_role === 'Scribe' ? 'Scribe' : 'Judge';
  const { ringSummaries, contacts, assignmentsToday } = buildTodaySnapshot(
    assignments,
    panelContacts,
  );

  const today = assignments.filter((a) => classifyAssignment(a) === 'today');
  const upcoming = assignments.filter((a) => classifyAssignment(a) === 'upcoming');
  const upcomingCount = today.length + upcoming.length;

  return (
    <section>
      <div className="fa-page-head">
        <div>
          <h2>My Assignments</h2>
          <p>Today&apos;s ring times and every show you&apos;re on the panel for.</p>
        </div>
        <span className="fa-badge fa-live !px-3.5 !py-2 !text-[12.5px]">
          <span className="fa-dot" />
          {roleLabel} · {upcomingCount} upcoming assignment{upcomingCount === 1 ? '' : 's'}
        </span>
      </div>

      {isSuperAdminPreview && <SuperAdminPreviewNotice showName={previewShowName} />}

      <JudgingStatusCard
        ringSummaries={ringSummaries}
        contacts={contacts}
        assignmentsToday={assignmentsToday}
        showResultsLink={today.length > 0}
      />

      {assignments.length === 0 ? (
        <div className="fa-mini-card text-center">
          <p>
            You are not on any class panel. An organizer assigns a {roleLabel.toLowerCase()} to a
            class from Show Manager, and it appears here once they do.
          </p>
        </div>
      ) : (
        <>
          <h3 className="mb-3 text-[15px] font-semibold tracking-[-.2px] text-[var(--fa-ink)]">
            Today&apos;s ring times
          </h3>
          <div className="mb-8 flex flex-col gap-3">
            {today.length === 0 ? (
              <div className="fa-mini-card">
                <p>Nothing on the panel for you today.</p>
              </div>
            ) : (
              today.map((a) => (
                <AssignmentCard
                  key={`${a.classId}-${a.seatId}`}
                  assignment={a}
                  variant="today"
                  completed={isAssignmentComplete(a)}
                />
              ))
            )}
          </div>

          <h3 className="mb-3 text-[15px] font-semibold tracking-[-.2px] text-[var(--fa-ink)]">
            Upcoming
          </h3>
          <div className="flex flex-col gap-3">
            {upcoming.length === 0 ? (
              <div className="fa-mini-card">
                <p>Nothing else scheduled yet.</p>
              </div>
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
    </section>
  );
}
