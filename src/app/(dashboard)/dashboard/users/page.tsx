import type { Metadata } from 'next';
import { getOrganizerContext } from '@/modules/staff/data/context';
import { listAllUsersAcrossShows } from '@/modules/staff/data/queries';
import { listClasses } from '@/modules/shows/data/setup-queries';
import { UsersDirectory } from '@/modules/staff/ui/users-directory';
import { EmptyPanel } from '@/modules/staff/ui/workspace-page';
import type { ClassOption } from '@/modules/staff/ui/add-user-dialog';

export const metadata: Metadata = { title: 'Users — Field & Arena' };

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

  const [users, classLists] = await Promise.all([
    listAllUsersAcrossShows(context.shows),
    Promise.all(context.shows.map((show) => listClasses(show.id))),
  ]);

  const classesByShow: Record<string, ClassOption[]> = {};
  context.shows.forEach((show, i) => {
    classesByShow[show.id] = (classLists[i] ?? []).map((c) => ({
      id: c.id,
      label: c.displayName?.trim() ? c.displayName : c.label,
    }));
  });

  return (
    <UsersDirectory
      rows={users}
      shows={context.shows}
      initialShowId={context.currentShow.id}
      classesByShow={classesByShow}
    />
  );
}
