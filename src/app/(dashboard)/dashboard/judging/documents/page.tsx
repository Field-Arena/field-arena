import type { Metadata } from 'next';
import { listMyAssignments, listPanelContacts } from '@/modules/judging/data/queries';
import { getStaffProfile } from '@/modules/auth/data/queries';
import { buildDemoAssignments, buildDemoPanelContacts, buildTodaySnapshot } from '@/modules/judging/utils';
import { JudgingStatusCard } from '@/modules/judging/ui/judging-status-card';
import { JUDGING_REFERENCE_DOCS } from '@/modules/judging/constants';
import { SuperAdminPreviewNotice } from '@/modules/judging/ui/superadmin-preview-notice';
import { ScreenLede, ScreenTitle } from '@/shared/ui/organizer/card';

export const metadata: Metadata = { title: 'Documents — Field & Arena' };

/**
 * General rule references, ported from Judge Workspace.dc.html's Documents
 * tab. `href="#"` in the design too — see JUDGING_REFERENCE_DOCS's doc
 * comment for why these stay inert rather than faking a download.
 */
export default async function JudgingDocumentsPage() {
  const todayIso = new Date().toISOString().slice(0, 10);
  const [profile, realAssignments, realContacts] = await Promise.all([
    getStaffProfile(),
    listMyAssignments(),
    listPanelContacts(),
  ]);
  const isSuperAdminPreview = profile?.platform_role === 'SuperAdmin';
  const assignments = isSuperAdminPreview ? buildDemoAssignments(todayIso) : realAssignments;
  const contacts = isSuperAdminPreview ? buildDemoPanelContacts() : realContacts;
  const snapshot = buildTodaySnapshot(assignments, contacts, todayIso);

  return (
    <>
      <div className="mb-[22px]">
        <ScreenTitle>Documents</ScreenTitle>
        <ScreenLede className="mb-0">
          Test sheets and rule references for your upcoming classes.
        </ScreenLede>
      </div>

      {isSuperAdminPreview && <SuperAdminPreviewNotice />}

      <JudgingStatusCard rings={snapshot.rings} contacts={snapshot.contacts} />

      <div className="flex flex-col gap-3">
        {JUDGING_REFERENCE_DOCS.map((doc) => (
          <div
            key={doc.name}
            className="flex items-center gap-5 rounded-xl border border-[#E9EDEB] bg-white p-[18px_20px]"
          >
            <span className="min-w-0 flex-1 font-[Newsreader,serif] text-lg font-semibold text-ink-deep">
              {doc.name}
            </span>
            <span className="flex-none text-[13px] whitespace-nowrap text-[#7A8781]">
              {doc.detail}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-4 text-[13px] leading-[1.55] text-[#7A8781]">
        General references that apply to every class. The test sheet for a specific class is on
        that class in My Assignments.
      </p>
    </>
  );
}
