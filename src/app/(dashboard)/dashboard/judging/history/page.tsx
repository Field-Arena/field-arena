import type { Metadata } from 'next';
import Link from 'next/link';
import {
  listMyAssignments,
  listMyScoredRides,
  getPreviewShowName,
} from '@/modules/judging/data/queries';
import { getStaffProfile } from '@/shared/lib/auth/session';
import { classifyAssignment } from '@/modules/judging/utils/classify-assignment';
import { SuperAdminPreviewNotice } from '@/modules/judging/ui/superadmin-preview-notice';
import { formatDateShort } from '@/shared/lib/format/date';
import { resolveTimeZone, todayInZone } from '@/shared/lib/format/time-zone';
import { scoredDayIso } from '@/modules/judging/utils/scored-day';

export const metadata: Metadata = { title: 'History — Field & Arena' };

function formatScore(raw: string | null): string {
  if (!raw) return '—';
  const n = Number(raw);
  return Number.isNaN(n) ? raw : `${n.toFixed(3)}%`;
}

export default async function JudgingHistoryPage() {
  const [profile, assignments] = await Promise.all([getStaffProfile(), listMyAssignments()]);
  const isSuperAdminPreview = profile?.platform_role === 'SuperAdmin';
  const previewShowName = isSuperAdminPreview ? await getPreviewShowName() : null;

  const history = assignments.filter((a) => classifyAssignment(a) === 'history');
  const rides = await listMyScoredRides(history);
  // Classes that closed with nothing finalized still belong on the record.
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
  const classesWithoutRides = history.filter((a) => !rides.some((r) => r.classId === a.classId));

  return (
    <section>
      <div className="fa-page-head">
        <div>
          <h2>History</h2>
          <p>Tests you&apos;ve scored across shows — open one to see the full scorecard.</p>
        </div>
      </div>

      {isSuperAdminPreview && <SuperAdminPreviewNotice showName={previewShowName} />}

      {history.length === 0 ? (
        <div className="fa-mini-card text-center">
          <p>No completed assignments yet.</p>
        </div>
      ) : (
        <div className="fa-card">
          <div className="overflow-x-auto">
            <table className="fa-table min-w-[720px]">
              <thead>
                <tr>
                  <th>Show</th>
                  <th>Test</th>
                  <th>Rider</th>
                  <th className="!text-right">Score</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {rides.map((r) => (
                  <tr key={r.entryId}>
                    <td className="font-semibold !text-[var(--fa-ink)]">{r.showName}</td>
                    <td>
                      <Link
                        href={`/dashboard/judging/history/${r.classId}`}
                        prefetch={false}
                        className="text-inherit no-underline hover:text-[var(--fa-brand)]"
                        title="Class placings"
                      >
                        {r.classLabel}
                      </Link>
                    </td>
                    <td>
                      <Link
                        href={`/dashboard/judging/history/${r.classId}/${r.entryId}`}
                        prefetch={false}
                        className="text-inherit no-underline hover:text-[var(--fa-brand)]"
                        title="Scorecard"
                      >
                        {r.rider}
                      </Link>
                      <div className="text-[12px] text-[var(--fa-ink-3)]">{r.horse}</div>
                    </td>
                    <td className="fa-num">{formatScore(r.score)}</td>
                    <td>
                      {rideDays.get(r.entryId)?.day === rideDays.get(r.entryId)?.today
                        ? 'Today'
                        : formatDateShort(rideDays.get(r.entryId)?.day)}
                    </td>
                  </tr>
                ))}
                {classesWithoutRides.map((a) => (
                  <tr key={`${a.classId}-${a.seatId}`}>
                    <td className="font-semibold !text-[var(--fa-ink)]">{a.showName}</td>
                    <td>
                      <Link
                        href={`/dashboard/judging/history/${a.classId}`}
                        prefetch={false}
                        className="text-inherit no-underline hover:text-[var(--fa-brand)]"
                      >
                        {a.classLabel}
                      </Link>
                    </td>
                    <td className="text-[var(--fa-ink-3)]">No rides finalized</td>
                    <td className="fa-num">—</td>
                    <td>{formatDateShort(a.classDate ?? a.showDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
