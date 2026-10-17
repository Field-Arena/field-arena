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
import { EmptyState, PageHeader } from '@/shared/ui/organizer/fa-page';

export const metadata: Metadata = { title: 'Panel & Contacts — Field & Arena' };

export default async function JudgingPanelPage() {
  const todayIso = new Date().toISOString().slice(0, 10);
  const [profile, realAssignments, realContacts] = await Promise.all([
    getStaffProfile(),
    listMyAssignments(todayIso),
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
      <PageHeader eyebrow="Who else is on the panel with you" title="Panel & Contacts" />

      {isSuperAdminPreview && <SuperAdminPreviewNotice showName={previewShowName} />}

      <JudgingStatusCard
        rings={snapshot.rings}
        contacts={snapshot.contacts}
        assignmentsToday={snapshot.assignmentsToday}
      />

      {contacts.length === 0 ? (
        <EmptyState title="No one else on your panels yet." />
      ) : (
        <div className="flex flex-col gap-2.5">
          {contacts.map((c) => (
            <PanelContactCard key={`${c.staffId}-${c.showName}-${c.role}`} contact={c} />
          ))}
        </div>
      )}
    </>
  );
}
