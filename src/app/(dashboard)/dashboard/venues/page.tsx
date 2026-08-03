import type { Metadata } from 'next';
import { getOrganizerContext } from '@/modules/staff/data/context';
import { listVenues } from '@/modules/organizations/data/queries';
import { getShowManagerVitals } from '@/modules/shows/data/queries';
import { createServerClient } from '@/shared/lib/supabase/server';
import { WorkspaceHeader } from '@/shared/ui/organizer/workspace-header';
import { VenueList } from '@/modules/organizations/ui/venue-list';
import { EmptyPanel } from '@/modules/staff/ui/workspace-page';
import { NewShowButton } from '@/modules/shows/ui/show-manager/new-show-button';

export const metadata: Metadata = { title: 'Venues — Field & Arena' };

/**
 * The organization's reusable venue library — a full rebuild off the bare
 * scaffold this page used to be (raw inline `createServerClient()` reads, a
 * read-only table, no add/edit/delete). Org-scoped, not show-scoped, which
 * is the whole point: address and contact details, the ring layout and the
 * stable/stall structure are typed once (`modules/organizations`) and picked
 * up by any show at that venue. Per-show stall *assignments* deliberately do
 * not live here — those are inherently per-show and belong on
 * shows.stable_chart.
 *
 * `?show=` and the WorkspaceHeader chrome above the venue list are wired
 * exactly like users/page.tsx — see that file's doc comment for why this
 * header is shared rather than rebuilt per page. The consequence carried
 * over from that choice: an organization with no shows yet sees the same
 * "No shows yet" panel Users does, rather than a bare venue list, because
 * the header's lifecycle/stat/ring strip has no show to describe without
 * one. Venues themselves are still org-wide, not filtered by the selected
 * show — only the header chrome is show-scoped.
 */
export default async function VenuesPage({
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
          note="Venues are reusable across your organization, but the workspace header above them needs at least one show first."
        />
      </div>
    );
  }

  // context.currentShow is only ever set once getOrganizerContext has already
  // resolved an orgId (shows are loaded from that orgId in the first place),
  // so this can't actually be null here — asserted rather than silently
  // falling back to an empty-string org id that would just return no rows.
  if (!context.orgId) throw new Error('Resolved a current show without an organization.');

  const supabase = await createServerClient();
  const [{ stats, stage }, showRow, venues] = await Promise.all([
    getShowManagerVitals(context.currentShow.id),
    supabase.from('shows').select('locations').eq('id', context.currentShow.id).single(),
    listVenues(context.orgId),
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
      />

      <VenueList venues={venues} />
    </div>
  );
}
