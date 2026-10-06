import type { Metadata } from 'next';
import { listPanelContacts, getPreviewShowName } from '@/modules/judging/data/queries';
import { getStaffProfile } from '@/shared/lib/auth/session';
import { buildDemoPanelContacts } from '@/modules/judging/utils/build-demo-panel-contacts';
import { PanelContactCard } from '@/modules/judging/ui/panel-contact-card';
import { SuperAdminPreviewNotice } from '@/modules/judging/ui/superadmin-preview-notice';

export const metadata: Metadata = { title: 'Panel & Contacts — Field & Arena' };

export default async function JudgingPanelPage() {
  const [profile, realContacts] = await Promise.all([getStaffProfile(), listPanelContacts()]);
  const isSuperAdminPreview = profile?.platform_role === 'SuperAdmin';
  // Real rows come back whenever a show is being previewed; the demo builders
  // are the fallback for a SuperAdmin who hasn't picked one.
  const previewShowName = isSuperAdminPreview ? await getPreviewShowName() : null;
  const useDemoData = isSuperAdminPreview && previewShowName === null;
  const contacts = useDemoData ? buildDemoPanelContacts() : realContacts;

  return (
    <section>
      <div className="fa-page-head">
        <div>
          <h2>Panel &amp; Contacts</h2>
          <p>The officials you&apos;re sharing the panel with.</p>
        </div>
      </div>

      {isSuperAdminPreview && <SuperAdminPreviewNotice showName={previewShowName} />}

      {contacts.length === 0 ? (
        <div className="fa-mini-card text-center">
          <p>No one else on your panels yet.</p>
        </div>
      ) : (
        <div className="fa-grid2">
          {contacts.map((c) => (
            <PanelContactCard key={`${c.staffId}-${c.showName}-${c.role}`} contact={c} />
          ))}
        </div>
      )}
    </section>
  );
}
