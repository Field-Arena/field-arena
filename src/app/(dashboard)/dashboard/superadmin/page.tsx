import type { Metadata } from 'next';
import { listOrganizations } from '@/modules/superadmin/data/queries';
import { OrganizationsTable } from '@/modules/superadmin/ui/organizations-table';
import { StatTile } from '@/shared/ui/stat-tile';

export const metadata: Metadata = {
  title: 'Super Admin — Field & Arena',
};

/**
 * "Clients — Organizers": the view the legacy console opened on.
 *
 * Heading, description and the three summary tiles are carried over from
 * public/views/superadmin.html so the console reads the same to anyone who used
 * it. The numbers are real rows now, where the legacy console's were a hardcoded
 * client-side array.
 */
export default async function SuperAdminOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const all = await listOrganizations();

  // Filtered here rather than in the database: the organizer list is small and
  // already fetched in full for the totals, so a second round trip per keystroke
  // would cost more than it saves. Name and location both match, since an
  // organizer is often looked up by the town a show runs in.
  const query = q?.trim().toLowerCase();
  const organizations = query
    ? all.filter((org) =>
        [org.name, org.city, org.region].some((field) =>
          (field ?? '').toLowerCase().includes(query)
        )
      )
    : all;

  // Totals describe the platform, so they always reflect every organization —
  // narrowing them to the current search would make them read as platform
  // figures while silently meaning something else.
  const totalShows = all.reduce((sum, org) => sum + org.showCount, 0);
  const totalRiders = all.reduce((sum, org) => sum + org.riderCount, 0);

  return (
    <div className="space-y-6">
      <div className="max-w-[640px]">
        <h1 className="mb-2 font-serif text-[30px] font-bold leading-tight text-hunter-deep">
          Clients — Organizers
        </h1>
        <p className="text-fa-muted text-[14.5px] leading-relaxed">
          Your organizers are the platform&rsquo;s clients. Search or pick one at the top to drop
          into that organizer&rsquo;s world and work exactly as they do &mdash; you can switch
          organizers from the top bar any time. Or choose one below.
        </p>
      </div>

      <section aria-label="Platform totals">
        <div className="flex flex-wrap gap-3">
          <StatTile label="Organizers" value={all.length} className="min-w-[128px]" />
          <StatTile label="Shows" value={totalShows} className="min-w-[128px]" />
          <StatTile label="Riders (est.)" value={totalRiders} className="min-w-[128px]" />
        </div>
      </section>

      <section aria-label="Organizers" className="space-y-3">
        {query && (
          <p className="text-fa-muted text-[13px]">
            {organizations.length} of {all.length} organizers matching &ldquo;{q}&rdquo;
          </p>
        )}
        <OrganizationsTable organizations={organizations} />
      </section>
    </div>
  );
}
