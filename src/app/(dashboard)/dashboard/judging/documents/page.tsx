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
import { JudgingStatusCard } from '@/modules/judging/ui/judging-status-card';
import { JUDGING_REFERENCE_DOCS, USDF_TEST_SHEETS_URL } from '@/modules/judging/constants';
import { classifyAssignment } from '@/modules/judging/utils/classify-assignment';
import { SuperAdminPreviewNotice } from '@/modules/judging/ui/superadmin-preview-notice';
import {
  FA_MUTED,
  FA_TABLE,
  FA_TABLE_WRAP,
  FA_TD,
  FA_TH,
  FA_THEAD_ROW,
  FA_TR,
  PageHeader,
} from '@/shared/ui/organizer/fa-page';

export const metadata: Metadata = { title: 'Documents — Field & Arena' };

export default async function JudgingDocumentsPage() {
  // Demo rows only; real rows carry today in their own show's timezone.
  const demoTodayIso = todayInZone(resolveTimeZone());
  const [profile, realAssignments, realContacts] = await Promise.all([
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
  const contacts = useDemoData ? buildDemoPanelContacts() : realContacts;
  const snapshot = buildTodaySnapshot(assignments, contacts);
  // One test sheet per class still ahead of you (today or later), deduped by
  // test — the same sheet across two shows is one download.
  const sheets = [
    ...new Map(
      assignments
        .filter((a) => classifyAssignment(a) !== 'history')
        .map((a) => [a.classLabel, a] as const),
    ).values(),
  ];

  return (
    <>
      <PageHeader
        eyebrow="Test sheets and rule references for your upcoming classes"
        title="Documents"
      />

      {isSuperAdminPreview && <SuperAdminPreviewNotice showName={previewShowName} />}

      <JudgingStatusCard
        rings={snapshot.rings}
        contacts={snapshot.contacts}
        assignmentsToday={snapshot.assignmentsToday}
      />

      <div className={FA_TABLE_WRAP}>
        <table className={FA_TABLE}>
          <thead>
            <tr className={FA_THEAD_ROW}>
              <th className={FA_TH}>Document</th>
              <th className={FA_TH}>Detail</th>
            </tr>
          </thead>
          <tbody>
            {sheets.map((a) => (
              <tr key={`sheet-${a.classLabel}`} className={FA_TR}>
                <td className={FA_TD}>
                  <a
                    href={USDF_TEST_SHEETS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-[#0D2C23] underline decoration-[#B4BFB9] underline-offset-2 hover:text-[#1A5B3C]"
                  >
                    {a.classLabel} ↗
                  </a>
                </td>
                <td className={`${FA_TD} text-[#5A6B63]`}>Official test sheet · {a.showName}</td>
              </tr>
            ))}
            {JUDGING_REFERENCE_DOCS.map((doc) => (
              <tr key={doc.name} className={FA_TR}>
                <td className={FA_TD}>
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-[#0D2C23] underline decoration-[#B4BFB9] underline-offset-2 hover:text-[#1A5B3C]"
                  >
                    {doc.name} ↗
                  </a>
                </td>
                <td className={`${FA_TD} text-[#5A6B63]`}>{doc.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className={`mt-3 leading-[1.55] ${FA_MUTED}`}>
        General references that apply to every class. The test sheet for a specific class is on that
        class in My Assignments.
      </p>
    </>
  );
}
