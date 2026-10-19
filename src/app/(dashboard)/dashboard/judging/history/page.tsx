import type { Metadata } from 'next';
import Link from 'next/link';
import {
  listMyAssignments,
  listMyScoredRides,
  listPanelContacts,
  getPreviewShowName,
} from '@/modules/judging/data/queries';
import { getStaffProfile } from '@/shared/lib/auth/session';
import { buildDemoAssignments } from '@/modules/judging/utils/build-demo-assignments';
import { buildDemoPanelContacts } from '@/modules/judging/utils/build-demo-panel-contacts';
import { buildTodaySnapshot } from '@/modules/judging/utils/build-today-snapshot';
import { classifyAssignment } from '@/modules/judging/utils/classify-assignment';
import { scoredDayIso } from '@/modules/judging/utils/scored-day';
import { JudgingStatusCard } from '@/modules/judging/ui/judging-status-card';
import { AssignmentCard } from '@/modules/judging/ui/assignment-card';
import { SuperAdminPreviewNotice } from '@/modules/judging/ui/superadmin-preview-notice';
import { formatDateShort } from '@/shared/lib/format/date';
import { resolveTimeZone, todayInZone } from '@/shared/lib/format/time-zone';
import { cn } from '@/shared/lib/utils';
import {
  EmptyState,
  FA_MUTED,
  FA_TABLE,
  FA_TABLE_WRAP,
  FA_TD,
  FA_TH,
  FA_THEAD_ROW,
  FA_TR,
  PageHeader,
  SectionLabel,
} from '@/shared/ui/organizer/fa-page';

export const metadata: Metadata = { title: 'History — Field & Arena' };

function formatScore(raw: string | null): string {
  if (!raw) return '—';
  const n = Number(raw);
  return Number.isNaN(n) ? raw : `${n.toFixed(3)}%`;
}

const ROW_LINK = 'text-[#0D2C23] no-underline hover:text-[#1A5B3C]';

export default async function JudgingHistoryPage() {
  // Demo rows only; real rows carry today in their own show's timezone.
  const demoTodayIso = todayInZone(resolveTimeZone());
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

  const snapshotAssignments = useDemoData ? buildDemoAssignments(demoTodayIso) : assignments;
  const snapshotContacts = useDemoData ? buildDemoPanelContacts() : realContacts;
  const snapshot = buildTodaySnapshot(snapshotAssignments, snapshotContacts);
  const history = assignments.filter((a) => classifyAssignment(a) === 'history');

  // Every ride you scored on those classes, with the day it was scored as seen
  // in the show's own timezone.
  const rides = await listMyScoredRides(history);
  const assignmentByClass = new Map(history.map((a) => [a.classId, a]));
  const rideDays = new Map(
    rides.map((r) => {
      const a = assignmentByClass.get(r.classId);
      return [
        r.entryId,
        {
          day: scoredDayIso(r.scoredAt, a?.timeZone ?? resolveTimeZone()),
          today: a?.todayIso ?? todayInZone(resolveTimeZone()),
        },
      ] as const;
    }),
  );

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
        <>
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

          {rides.length > 0 && (
            <>
              <SectionLabel>Rides you&apos;ve scored</SectionLabel>
              <div className={FA_TABLE_WRAP}>
                <table className={cn(FA_TABLE, 'min-w-[720px]')}>
                  <thead>
                    <tr className={FA_THEAD_ROW}>
                      <th className={FA_TH}>Show</th>
                      <th className={FA_TH}>Test</th>
                      <th className={FA_TH}>Rider</th>
                      <th className={cn(FA_TH, 'text-right')}>Score</th>
                      <th className={FA_TH}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rides.map((r) => {
                      const day = rideDays.get(r.entryId);
                      return (
                        <tr key={r.entryId} className={FA_TR}>
                          <td className={cn(FA_TD, 'font-semibold text-[#0D2C23]')}>
                            {r.showName}
                          </td>
                          <td className={FA_TD}>
                            <Link
                              href={`/dashboard/judging/history/${r.classId}`}
                              prefetch={false}
                              className={ROW_LINK}
                              title="Class placings"
                            >
                              {r.classLabel}
                            </Link>
                          </td>
                          <td className={FA_TD}>
                            <Link
                              href={`/dashboard/judging/history/${r.classId}/${r.entryId}`}
                              prefetch={false}
                              className={cn(ROW_LINK, 'font-semibold')}
                              title="Scorecard"
                            >
                              {r.rider}
                            </Link>
                            <div className={FA_MUTED}>{r.horse}</div>
                          </td>
                          <td
                            className={cn(
                              FA_TD,
                              'text-right font-mono font-semibold text-[#0D2C23]',
                            )}
                          >
                            {formatScore(r.score)}
                          </td>
                          <td className={cn(FA_TD, 'text-[#5A6B63]')}>
                            {day?.day === day?.today ? 'Today' : formatDateShort(day?.day)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}
