import type { Metadata } from 'next';
import { getOrganizerContext } from '@/modules/staff/data/context';
import { listAllUsersAcrossShows, getRingCoverageByShow } from '@/modules/staff/data/queries';
import { listClasses } from '@/modules/shows/data/setup-queries';
import { listJudgePickerOptions } from '@/modules/judges/data/queries';
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

  // The Users page is the organization's own staff screen (Organizers and the
  // Show Admins they staff), so the saved-judges picker is scoped to that org.
  const [users, classLists, ringCoverageByShow, judges] = await Promise.all([
    listAllUsersAcrossShows(context.shows),
    Promise.all(context.shows.map((show) => listClasses(show.id))),
    getRingCoverageByShow(context.shows),
    context.orgId ? listJudgePickerOptions(context.orgId) : Promise.resolve([]),
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
      initialShowFilter={requestedShowId ? context.currentShow.id : ''}
      classesByShow={classesByShow}
      ringCoverageByShow={ringCoverageByShow}
      judges={judges}
    />
  );
}
