import type { Metadata } from 'next';
import {
  listMyAssignments,
  listPanelContacts,
  getPreviewShowName,
} from '@/modules/judging/data/queries';
import { getStaffProfile } from '@/modules/auth/data/queries';
import { buildDemoAssignments } from '@/modules/judging/utils/build-demo-assignments';
import { buildDemoPanelContacts } from '@/modules/judging/utils/build-demo-panel-contacts';
import { buildTodaySnapshot } from '@/modules/judging/utils/build-today-snapshot';
import { JudgingStatusCard } from '@/modules/judging/ui/judging-status-card';
import { PanelContactCard } from '@/modules/judging/ui/panel-contact-card';
import { SuperAdminPreviewNotice } from '@/modules/judging/ui/superadmin-preview-notice';
import { Card, ScreenLede, ScreenTitle } from '@/shared/ui/organizer/card';

export const metadata: Metadata = { title: 'Panel & Contacts — Field & Arena' };

export default async function JudgingPanelPage() {
  const todayIso = new Date().toISOString().slice(0, 10);
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
  const assignments = useDemoData ? buildDemoAssignments(todayIso) : realAssignments;
  const contacts = useDemoData ? buildDemoPanelContacts() : realContacts;
  const snapshot = buildTodaySnapshot(assignments, contacts, todayIso);

  return (
    <>
      <div className="mb-[22px]">
        <ScreenTitle>Panel & Contacts</ScreenTitle>
        <ScreenLede className="mb-0">Who else is on the panel with you.</ScreenLede>
      </div>

      {isSuperAdminPreview && <SuperAdminPreviewNotice showName={previewShowName} />}

      <JudgingStatusCard
        rings={snapshot.rings}
        contacts={snapshot.contacts}
        assignmentsToday={snapshot.assignmentsToday}
      />

      {contacts.length === 0 ? (
        <Card className="p-[60px_20px] text-center text-[14.5px] text-[#7A8781]">
          No one else on your panels yet.
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {contacts.map((c) => (
            <PanelContactCard key={`${c.staffId}-${c.showName}-${c.role}`} contact={c} />
          ))}
        </div>
      )}
    </>
  );
}
