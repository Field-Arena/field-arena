import type { Metadata } from 'next';
import { getOrganizerContext } from '@/modules/staff/data/context';
import { listJudges } from '@/modules/judges/data/queries';
import { JudgesScreen } from '@/modules/judges/ui/judges-screen';
import { EmptyPanel } from '@/modules/staff/ui/workspace-page';

export const metadata: Metadata = { title: 'Judges — Field & Arena' };

export default async function JudgesPage() {
  const context = await getOrganizerContext();

  if (!context.orgId) {
    return (
      <div className="text-ink-deep font-[family-name:var(--font-ar)]">
        <EmptyPanel
          title="No organization"
          note="This account is not attached to an organization."
        />
      </div>
    );
  }

  const isOrganizerOrImpersonating =
    context.profile.platform_role === 'Organizer' || context.impersonating;
  if (!isOrganizerOrImpersonating) {
    return (
      <div className="text-ink-deep font-[family-name:var(--font-ar)]">
        <EmptyPanel
          title="Not available for your role"
          note="The Judges list is managed by your organization's Organizer. A Show Admin adds judges to the shows they are staffed on from Users."
        />
      </div>
    );
  }

  const judges = await listJudges(context.orgId);

  return <JudgesScreen judges={judges} />;
}
