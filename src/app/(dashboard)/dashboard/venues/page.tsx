import type { Metadata } from 'next';
import { getOrganizerContext } from '@/modules/staff/data/context';
import { listVenues } from '@/modules/organizations/data/queries';
import { VenueList } from '@/modules/organizations/ui/venue-list';
import { EmptyPanel } from '@/modules/staff/ui/workspace-page';

export const metadata: Metadata = { title: 'Venues — Field & Arena' };

/**
 * The organization's reusable venue library — org-wide, not show-scoped,
 * matching Member Database's own full-screen treatment: address and contact
 * details, the ring layout and the stable/stall structure are typed once
 * (`modules/organizations`) and picked up by any show at that venue.
 * Per-show stall *assignments* deliberately do not live here — those are
 * inherently per-show and belong on shows.stable_chart.
 */
export default async function VenuesPage() {
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

  const venues = await listVenues(context.orgId);

  return <VenueList venues={venues} />;
}
