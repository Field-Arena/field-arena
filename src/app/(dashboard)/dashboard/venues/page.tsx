import type { Metadata } from 'next';
import { getOrganizerContext } from '@/modules/staff/data/context';
import { createServerClient } from '@/shared/lib/supabase/server';
import { WorkspacePage, EmptyPanel } from '@/modules/staff/ui/workspace-page';

export const metadata: Metadata = { title: 'Venues — Field & Arena' };

/**
 * The organization's reusable venue library.
 *
 * Org-scoped, not show-scoped, which is the whole point: address and contact
 * details, the ring layout and the stable structure are typed once and picked up
 * by any show at that venue. Per-show stall assignments deliberately do not live
 * here — those are inherently per-show and belong on shows.stable_chart.
 */
export default async function VenuesPage() {
  const context = await getOrganizerContext();

  if (!context.orgId) {
    return (
      <WorkspacePage
        title="Venues"
        description="Reusable locations, built once and picked up by any show."
        orgName={context.orgName}
        showPicker={false}
      >
        <EmptyPanel title="No organization" note="This account is not attached to an organization." />
      </WorkspacePage>
    );
  }

  const supabase = await createServerClient();
  const [{ data: venues, error }, { data: shows }] = await Promise.all([
    supabase
      .from('venues')
      .select('id, name, city, region, country, address, phone, contact, website, rings, stables')
      .eq('org_id', context.orgId)
      .order('name'),
    supabase.from('shows').select('venue_id').eq('org_id', context.orgId),
  ]);
  if (error) throw error;

  const usage = new Map<string, number>();
  for (const show of shows ?? []) {
    if (show.venue_id) usage.set(show.venue_id, (usage.get(show.venue_id) ?? 0) + 1);
  }

  return (
    <WorkspacePage
      title="Venues"
      description="Reusable locations, built once and picked up by any show."
      orgName={context.orgName}
      showPicker={false}
    >
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
        <Stat label="Venues" value={venues.length} />
        <Stat
          label="In use"
          value={venues.filter((v) => (usage.get(v.id) ?? 0) > 0).length}
          sub="attached to a show"
        />
        <Stat
          label="With ring layout"
          value={venues.filter((v) => Array.isArray(v.rings) && v.rings.length > 0).length}
        />
      </div>

      {venues.length === 0 ? (
        <EmptyPanel
          title="No venues yet"
          note="Add a venue to reuse its address, ring layout and stable structure across every show you run there."
        />
      ) : (
        <div style={{ overflowX: 'auto', marginTop: 14 }}>
          <table>
            <caption className="sr-only">Reusable venues for this organization</caption>
            <thead>
              <tr>
                <th scope="col">Venue</th>
                <th scope="col">Location</th>
                <th scope="col">Contact</th>
                <th scope="col" className="r">
                  Rings
                </th>
                <th scope="col" className="r">
                  Stables
                </th>
                <th scope="col" className="r">
                  Shows
                </th>
              </tr>
            </thead>
            <tbody>
              {venues.map((venue) => {
                const rings = Array.isArray(venue.rings) ? venue.rings.length : 0;
                const stables = Array.isArray(venue.stables) ? venue.stables.length : 0;
                return (
                  <tr key={venue.id}>
                    <td>
                      <strong>{venue.name}</strong>
                      {venue.address && (
                        <span style={{ display: 'block', fontSize: 12, color: 'var(--fa-muted)' }}>
                          {venue.address}
                        </span>
                      )}
                    </td>
                    <td>{[venue.city, venue.region].filter(Boolean).join(', ') || '—'}</td>
                    <td>
                      {venue.contact ?? '—'}
                      {venue.phone && (
                        <span style={{ display: 'block', fontSize: 12, color: 'var(--fa-muted)' }}>
                          {venue.phone}
                        </span>
                      )}
                    </td>
                    <td className="r">{rings || '—'}</td>
                    <td className="r">{stables || '—'}</td>
                    <td className="r">
                      <strong>{usage.get(venue.id) ?? 0}</strong>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </WorkspacePage>
  );
}

function Stat({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}
