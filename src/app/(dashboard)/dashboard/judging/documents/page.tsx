import type { Metadata } from 'next';
import { listMyAssignments, listPanelContacts } from '@/modules/judging/data/queries';
import { getStaffProfile } from '@/modules/auth/data/queries';
import { buildDemoAssignments } from '@/modules/judging/utils/build-demo-assignments';
import { buildDemoPanelContacts } from '@/modules/judging/utils/build-demo-panel-contacts';
import { buildTodaySnapshot } from '@/modules/judging/utils/build-today-snapshot';
import { JudgingStatusCard } from '@/modules/judging/ui/judging-status-card';
import { JUDGING_REFERENCE_DOCS } from '@/modules/judging/constants';
import { SuperAdminPreviewNotice } from '@/modules/judging/ui/superadmin-preview-notice';
import { ScreenLede, ScreenTitle } from '@/shared/ui/organizer/card';

export const metadata: Metadata = { title: 'Documents — Field & Arena' };

/**
 * General rule references, ported from Judge Workspace.dc.html's Documents
 * tab layout, with real external hrefs from legacy judge-scribe.html's
 * DOCS array (USDF/USEF sources) — see JUDGING_REFERENCE_DOCS.
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

      <JudgingStatusCard
        rings={snapshot.rings}
        contacts={snapshot.contacts}
        assignmentsToday={snapshot.assignmentsToday}
      />

      <div className="flex flex-col gap-3">
        {JUDGING_REFERENCE_DOCS.map((doc) => (
          <a
            key={doc.name}
            href={doc.url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:border-gold flex items-center gap-5 rounded-xl border border-[#E9EDEB] bg-white p-[18px_20px] transition-colors"
          >
            <span className="text-ink-deep min-w-0 flex-1 font-[Newsreader,serif] text-lg font-semibold">
              {doc.name} ↗
            </span>
            <span className="flex-none text-[13px] whitespace-nowrap text-[#7A8781]">
              {doc.detail}
            </span>
          </a>
        ))}
      </div>

      <p className="mt-4 text-[13px] leading-[1.55] text-[#7A8781]">
        General references that apply to every class. The test sheet for a specific class is on that
        class in My Assignments.
      </p>
    </>
  );
}
