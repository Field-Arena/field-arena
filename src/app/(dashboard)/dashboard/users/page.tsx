import type { Metadata } from 'next';
import { getOrganizerContext } from '@/modules/staff/data/context';
import { listAllUsersAcrossShows } from '@/modules/staff/data/queries';
import { getShowManagerVitals } from '@/modules/shows/data/queries';
import { createServerClient } from '@/shared/lib/supabase/server';
import { WorkspaceHeader } from '@/shared/ui/organizer/workspace-header';
import { UsersDirectory } from '@/modules/staff/ui/users-directory';
import { EmptyPanel } from '@/modules/staff/ui/workspace-page';
import { NewShowButton } from '@/modules/shows/ui/show-manager/new-show-button';
import { ResultsStubButton } from '@/modules/staff/ui/results-stub-button';

export const metadata: Metadata = { title: 'Users — Field & Arena' };

/**
 * The organizer "All Users" directory — a full rebuild of what used to be a
 * single-show staff table. See `modules/staff/data/queries.ts`'s
 * `listAllUsersAcrossShows` for the 3-way staff/rider/vendor composition this
 * page now shows, and `shared/ui/organizer/workspace-header.tsx` for the
 * lifecycle/stat/ring-clock chrome above it — the same header the design
 * repeats on Dashboard and Show Manager, extracted here as a reusable piece
 * rather than rebuilt inline (this page is the only one wired to it so far).
 *
 * `?show=` still selects which show the header's stats/lifecycle/rings
 * describe, same as every other organizer page. It is a *different* selection
 * from the "SHOW" section inside UsersDirectory, which is a client-side
 * choice of which show Add User/Upload/Export/Permissions act on — the
 * directory itself is org-wide regardless of either.
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
      <div className="font-[family-name:var(--font-ar)] text-ink-deep">
        <EmptyPanel
          title="No shows yet"
          note="Users are invited and managed per show, across your organization."
        />
      </div>
    );
  }

  const supabase = await createServerClient();
  const [{ stats, stage }, showRow, users] = await Promise.all([
    getShowManagerVitals(context.currentShow.id),
    supabase.from('shows').select('locations').eq('id', context.currentShow.id).single(),
    listAllUsersAcrossShows(context.shows),
  ]);

  const rings = ((showRow.data?.locations ?? []) as { name?: string; num?: number }[])
    .map((loc) => loc.name ?? (loc.num ? `Ring ${String(loc.num)}` : null))
    .filter((name): name is string => !!name);

  return (
    <div className="font-[family-name:var(--font-ar)] text-ink-deep">
      <WorkspaceHeader
        orgName={context.orgName}
        shows={context.shows}
        currentShow={context.currentShow}
        stage={stage}
        stats={stats}
        canViewMoney={context.canViewMoney}
        rings={rings}
        newShowSlot={<NewShowButton className="px-[15px] py-2.5 text-[13px]" />}
        trailingSlot={stage === 'live' ? <ResultsStubButton /> : undefined}
      />

      <UsersDirectory rows={users} shows={context.shows} initialShowId={context.currentShow.id} />
    </div>
  );
}
