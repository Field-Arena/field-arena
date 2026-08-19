import type { Metadata } from 'next';
import { getOrganizerContext } from '@/modules/staff/data/context';
import { listMembers } from '@/modules/organizations/data/queries';
import { MemberDatabaseScreen } from '@/modules/organizations/ui/member-database-screen';
import { EmptyPanel } from '@/modules/staff/ui/workspace-page';

export const metadata: Metadata = { title: 'Member Database — Field & Arena' };

export default async function MemberDatabasePage() {
  const context = await getOrganizerContext();

  if (!context.orgId) {
    return (
      <EmptyPanel title="No organization" note="This account is not attached to an organization." />
    );
  }

  const isOrganizerOrImpersonating =
    context.profile.platform_role === 'Organizer' || context.impersonating;
  if (!isOrganizerOrImpersonating) {
    return (
      <EmptyPanel
        title="Not available for your role"
        note="The member database is managed by your organization's Organizer — a Show Admin's access is always scoped to the show(s) they're staffed on."
      />
    );
  }

  const members = await listMembers(context.orgId);

  return (
    <MemberDatabaseScreen
      members={members}
      shows={context.shows.map((show) => ({ id: show.id, name: show.name }))}
    />
  );
}
