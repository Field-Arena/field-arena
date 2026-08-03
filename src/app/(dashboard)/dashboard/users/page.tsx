import type { Metadata } from 'next';
import { getOrganizerContext } from '@/modules/staff/data/context';
import { listAllUsersAcrossShows } from '@/modules/staff/data/queries';
import { UsersDirectory } from '@/modules/staff/ui/users-directory';
import { EmptyPanel } from '@/modules/staff/ui/workspace-page';

export const metadata: Metadata = { title: 'Users — Field & Arena' };

/**
 * The organizer "All Users" directory — org-wide, not show-scoped, matching
 * Member Database's own full-screen treatment (see that page's doc comment).
 * See `modules/staff/data/queries.ts`'s `listAllUsersAcrossShows` for the
 * 3-way staff/rider/vendor composition this page shows.
 *
 * `?show=` still exists, but only as the *target* show for Add User/Upload/
 * Export/Permissions inside UsersDirectory's own "Show" toolbar — a client-side
 * choice, independent of the "All shows" filter on the directory below it,
 * which is org-wide regardless.
 */
export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const { show: requestedShowId } = await searchParams;
  const context = await getOrganizerContext(requestedShowId);

  if (!context.currentShow) {
    return (
      <div className="text-ink-deep font-[family-name:var(--font-ar)]">
        <EmptyPanel
          title="No shows yet"
          note="Users are invited and managed per show, across your organization."
        />
      </div>
    );
  }

  const users = await listAllUsersAcrossShows(context.shows);

  return (
    <UsersDirectory rows={users} shows={context.shows} initialShowId={context.currentShow.id} />
  );
}
