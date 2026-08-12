import type { Metadata } from 'next';
import { listMyAssignments, listPanelContacts } from '@/modules/judging/data/queries';
import { getStaffProfile } from '@/modules/auth/data/queries';
import {
  buildDemoAssignments,
  buildDemoPanelContacts,
  buildTodaySnapshot,
} from '@/modules/judging/utils';
import { JudgingStatusCard } from '@/modules/judging/ui/judging-status-card';
import { PanelContactCard } from '@/modules/judging/ui/panel-contact-card';
import { SuperAdminPreviewNotice } from '@/modules/judging/ui/superadmin-preview-notice';
import { Card, ScreenLede, ScreenTitle } from '@/shared/ui/organizer/card';

export const metadata: Metadata = { title: 'Panel & Contacts — Field & Arena' };

/** Who else is seated on a panel with this person, across every class they're on. */
export default async function JudgingPanelPage() {
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
        <ScreenTitle>Panel & Contacts</ScreenTitle>
        <ScreenLede className="mb-0">Who else is on the panel with you.</ScreenLede>
      </div>

      {isSuperAdminPreview && <SuperAdminPreviewNotice />}

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
