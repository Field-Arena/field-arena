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
 *
 * Organizer/SuperAdmin only, matching legacy's ORG_MANAGER_ONLY_RESOURCES
 * (api/organizations/[id]/[resource].js): a Show Admin's authority is always
 * per-show, and the member database isn't scoped to any single show, so
 * there's no per-show permission that would make sense here. The RLS policy
 * (member_database_all) already enforces this — a Show Admin's query would
 * just come back empty — but this page says so explicitly rather than
 * showing an org with a suspiciously empty contact list.
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
