import type { Metadata } from 'next';
import { getOrganizerContext } from '@/modules/staff/data/context';
import { listMembers } from '@/modules/organizations/data/queries';
import { MemberDatabaseScreen } from '@/modules/organizations/ui/member-database-screen';
import { EmptyPanel } from '@/modules/staff/ui/workspace-page';

export const metadata: Metadata = { title: 'Member Database — Field & Arena' };

/**
 * The organization's contact database, ported from showstaff.html's
 * renderMemberDb.
 *
 * Org-scoped, not show-scoped — this is everyone the organization deals with
 * across every show, which is why it carries no show picker and why adding
 * someone to a show is an explicit action rather than where they live.
 */
export default async function MemberDatabasePage() {
  const context = await getOrganizerContext();

  if (!context.orgId) {
    return (
      <EmptyPanel
        title="No organization"
        note="This account is not attached to an organization."
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
