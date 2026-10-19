import { resolveTimeZone, todayInZone } from '@/shared/lib/format/time-zone';
import type { Metadata } from 'next';
import Link from 'next/link';
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
import { todayRingLabel } from '@/modules/judging/utils/today-ring-label';
import {
  LiveClock,
  PanelPopoverButton,
  RingPaceCard,
} from '@/modules/judging/ui/judging-status-card';
import { AssignmentCard } from '@/modules/judging/ui/assignment-card';
import { SuperAdminPreviewNotice } from '@/modules/judging/ui/superadmin-preview-notice';
import { formatDateShort } from '@/shared/lib/format/date';
import {
  EmptyState,
  FA_BTN,
  PageHeader,
  SectionLabel,
  StatBox,
  StatGrid,
} from '@/shared/ui/organizer/fa-page';

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
  const { rings, ringSummaries, contacts, assignmentsToday } = buildTodaySnapshot(
    assignments,
    panelContacts,
  );

  const today = assignments.filter((a) => classifyAssignment(a) === 'today');
  const upcoming = assignments.filter((a) => classifyAssignment(a) === 'upcoming');
  const completedCount = assignments.filter((a) => classifyAssignment(a) === 'history').length;
  const nextUpcoming = upcoming[0];
  const nextUpcomingDate = nextUpcoming
    ? formatDateShort(nextUpcoming.classDate) || formatDateShort(nextUpcoming.showDate)
    : '';

  return (
    <>
      <PageHeader
        eyebrow={
          <>
            {roleLabel} · <LiveClock /> · Today&apos;s ring times and every show you&apos;re on the
            panel for
          </>
        }
        title="My Assignments"
        actions={
          <>
            <PanelPopoverButton contacts={contacts} />
            {today.length > 0 && (
              <Link href="/dashboard/judging/results" prefetch={false} className={FA_BTN}>
                🏆 View results
              </Link>
            )}
          </>
        }
      />

      {isSuperAdminPreview && <SuperAdminPreviewNotice showName={previewShowName} />}

      <StatGrid cols={3}>
        <StatBox
          label="Today"
          value={`${String(today.length)} class${today.length === 1 ? '' : 'es'}`}
          note={todayRingLabel(rings, assignmentsToday)}
        />
        <StatBox
          label="Upcoming"
          value={upcoming.length}
          note={nextUpcomingDate ? `next: ${nextUpcomingDate}` : 'nothing scheduled yet'}
        />
        <StatBox label="Completed" value={completedCount} note="on this platform" />
      </StatGrid>

      <RingPaceCard ringSummaries={ringSummaries} />

      {assignments.length === 0 ? (
        <EmptyState
          title="You are not on any class panel"
          note={`An organizer assigns a ${roleLabel.toLowerCase()} to a class from ShowManager, and it appears here once they do.`}
        />
      ) : (
        <>
          <SectionLabel>Today</SectionLabel>
          <div className="mb-2 flex flex-col gap-2.5">
            {today.length === 0 ? (
              <EmptyState title="Nothing on the panel for you today." />
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

          <SectionLabel>Upcoming</SectionLabel>
          <div className="flex flex-col gap-2.5">
            {upcoming.length === 0 ? (
              <EmptyState title="Nothing else scheduled yet." />
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
